// ==UserScript==
// @name         B站学习进度助手 (Bilibili Study Helper)
// @namespace    https://github.com/LimiChan-2026
// @version      6.1
// @description  精修版：极简UI、自动记录时长、2-4倍速锁定（修复原生倍速菜单点击失效Bug）
// @author       LimiChan
// @match        *://www.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/LimiChan-2026/bilibili-study-helper/main/bilibili-study-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/LimiChan-2026/bilibili-study-helper/main/bilibili-study-helper.user.js
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 🎨 样式注入：强力去广告 & 界面美化
    // ==========================================
    GM_addStyle(`
        /* 隐藏播放列表上方的各种活动/广告卡片 */
        .video-pod .special-card,
        .video-pod .video-pod__activity,
        .video-pod .activity-m,
        .video-pod > a[target="_blank"],
        .video-sections-v1 .video-sections-activity,
        .slide-ad-exp,
        #activity_vote,
        .ad-report
        { display: none !important; height: 0 !important; margin: 0 !important; padding: 0 !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }

        /* 调整列表高度 */
        .video-pod .video-pod__body { max-height: calc(100vh - 250px) !important; }

        /* 悬浮球样式优化 */
        #bili-study-helper { position: fixed; top: 20%; right: 20px; width: 260px; background: #fff; border: 1px solid #eee; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-radius: 12px; z-index: 999999; font-family: sans-serif; color: #333; user-select: none; }
        #bili-study-helper.minimized { width: 45px !important; height: 45px !important; border-radius: 50%; border: 2px solid #00a1d6; cursor: pointer; overflow: hidden; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; }
        #bili-study-helper.minimized .panel-content, #bili-study-helper.minimized .panel-header { display: none !important; }
        #bili-study-helper.minimized::after { content: "📚"; font-size: 22px; line-height: 1; }
        .panel-header { background: #00a1d6; color: #fff; padding: 12px 15px; font-weight: bold; font-size: 15px; display: flex; justify-content: space-between; align-items: center; cursor: move; border-radius: 12px 12px 0 0; }
        .header-controls { display: flex; gap: 8px; }
        .panel-content { padding: 15px; }
        .input-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .input-group input { width: 70px; padding: 6px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }

        /* 按钮通用样式 */
        button.main-btn { width: 100%; padding: 10px 0; background: #00a1d6; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight:600; transition:0.2s; }
        button.main-btn:hover { background: #00b5e5; transform:scale(1.02); }

        .result-box { margin-top: 12px; padding: 10px; background: #f2faff; border-radius: 8px; display: none; border: 1px solid #cceeff; }
        .result-line { font-size: 13px; margin-bottom: 4px; color:#555; }
        .result-highlight { font-size: 16px; font-weight: bold; color: #00a1d6; }
        .header-btn { width: 24px; height: 24px; background: rgba(255,255,255,0.25); border-radius: 50%; text-align: center; line-height: 24px; cursor: pointer; font-size:12px; }
        .header-btn:hover { background: rgba(255,255,255,0.4); }
    `);

    // 看板相关常量
    const DASHBOARD_URL_QUERY = "study_dashboard";
    const DASHBOARD_FULL_URL = "https://www.bilibili.com/?" + DASHBOARD_URL_QUERY;

    function getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function formatSecondsToHMS(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    function formatDurationHuman(seconds) {
        if (seconds < 60) return `${seconds}秒`;
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}小时 ${m}分钟`;
        return `${m}分钟`;
    }

    function formatDurationDetailed(seconds) {
        if (seconds === 0) return "0分钟";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}小时 <span style="font-size:0.6em;opacity:0.8">${m}分钟</span>`;
        return `${m}分钟`;
    }

    // ==========================================
    // 📊 模式一：统计看板
    // ==========================================
    if (window.location.search.includes(DASHBOARD_URL_QUERY)) {
        renderDashboard();
        return;
    }

    function renderDashboard() {
        document.documentElement.innerHTML = "<head><title>B站学习中心</title></head><body></body>";
        const css = `
            :root { --bg-color: #F5F7FA; --text-primary: #1D1D1F; }
            body { background-color: var(--bg-color); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif; margin: 0; padding: 40px 20px; color: var(--text-primary); display: flex; justify-content: center; min-height: 100vh; background-image: radial-gradient(#E8F1F8 1px, transparent 1px); background-size: 20px 20px; }
            .app-container { width: 100%; max-width: 900px; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; }
            .header h1 { font-size: 32px; font-weight: 800; margin: 0; }
            .btn-group { display: flex; gap: 12px; }
            .header-btn { background: #fff; border: 1px solid #E1E1E6; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
            .card { border-radius: 20px; padding: 25px; position: relative; overflow: hidden; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); }
            .card-today { background: linear-gradient(135deg, #00C6FB 0%, #005BEA 100%); color: white; }
            .card-total { background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%); color: white; }
            .card-label { font-size: 14px; opacity: 0.9; margin-bottom: 10px; }
            .card-value { font-size: 42px; font-weight: 700; }
            .chart-wrapper { background: #fff; border-radius: 24px; padding: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
            .chart-body { display: flex; height: 340px; }
            .y-axis { display: flex; flex-direction: column; justify-content: space-between; padding-bottom: 26px; padding-right: 15px; margin-right: 10px; border-right: 1px dashed #eee; color: #999; font-size: 12px; min-width: 35px; text-align: right; }
            .chart-scroll-area { flex: 1; overflow-x: auto; display: flex; align-items: flex-end; }
            .bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 40px; position: relative; height: 100%; justify-content: flex-end; }
            .bar { width: 6px; border-radius: 8px 8px 0 0; background: linear-gradient(to top, #4FACFE 0%, #00F2FE 100%); transition: height 1s; }
            .bar-date { margin-top: 12px; font-size: 12px; color: #999; text-align: center; }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const studyLog = GM_getValue('studyLog', {});
        const todayKey = getTodayKey();
        const todaySeconds = studyLog[todayKey] || 0;
        let totalSeconds = 0;
        Object.values(studyLog).forEach(s => totalSeconds += s);

        const app = document.createElement('div');
        app.className = 'app-container';
        app.innerHTML = `
            <div class="header"><h1>学习中心</h1><div class="btn-group"><button class="header-btn" id="btn-export">📥 导出数据</button><button class="header-btn" id="btn-close">返回B站</button></div></div>
            <div class="summary-grid"><div class="card card-today"><div class="card-label">✨ 今日专注</div><div class="card-value">${formatDurationDetailed(todaySeconds)}</div></div><div class="card card-total"><div class="card-label">🏆 累计学习</div><div class="card-value">${formatDurationDetailed(totalSeconds)}</div></div></div>
            <div class="chart-wrapper">
                <div style="margin-bottom:20px;font-weight:bold;font-size:18px">近30天趋势</div>
                <div class="chart-body">
                    <div class="y-axis"><span>12h</span><span>9h</span><span>6h</span><span>3h</span><span>0h</span></div>
                    <div id="chart-render-area" class="chart-scroll-area"></div>
                </div>
            </div>
        `;
        document.body.appendChild(app);

        // 简易渲染图表
        const chartArea = document.getElementById('chart-render-area');
        const maxVal = 43200; // 12h
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const val = studyLog[key] || 0;
            const percent = Math.min((val/maxVal)*100, 100);
            const group = document.createElement('div');
            group.className = 'bar-group';
            group.innerHTML = `<div class="bar" style="height:${percent}%" title="${key}: ${formatDurationHuman(val)}"></div><div class="bar-date">${d.getMonth()+1}/${d.getDate()}</div>`;
            chartArea.appendChild(group);
        }

        document.getElementById('btn-close').onclick = () => window.location.href = "https://www.bilibili.com";
        document.getElementById('btn-export').onclick = () => {
             let csvContent = "data:text/csv;charset=utf-8,\uFEFF日期,学习时长(秒)\n";
             Object.keys(studyLog).sort().forEach(key => csvContent += `${key},${studyLog[key]}\n`);
             const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `study_data.csv`;
             document.body.appendChild(link); link.click();
        };
    }

    // ==========================================
    // 📺 模式二：视频助手悬浮球 (极简UI版)
    // ==========================================
    if (!window.location.href.includes('/video/')) return;

    const div = document.createElement('div');
    div.id = 'bili-study-helper';
    div.innerHTML = `
        <div class="panel-header" id="bili-header">
            <span id="bili-title">📚 学习助手</span>
            <div class="header-controls">
                <div class="header-btn" id="bili-stats-btn" title="查看学习统计">📊</div>
                <div class="header-btn" id="bili-mini-btn" title="最小化">－</div>
            </div>
        </div>
        <div class="panel-content">
            <div class="input-group">
                <input type="number" id="bili-start" title="起始集数">
                <span style="color:#ccc">-</span>
                <input type="number" id="bili-end" title="目标集数">
            </div>
            <button class="main-btn" id="bili-calc-btn">计算时长</button>
            <div id="bili-result-box" class="result-box"></div>

            <div class="input-group" style="margin-top: 15px; border-top: 1px dashed #eee; padding-top: 15px; margin-bottom: 0;">
                <span style="font-size: 13px; color: #555; font-weight: bold;">加速:</span>
                <input type="number" id="bili-custom-speed" step="0.1" min="2" max="4" value="2.3" style="width: 55px; margin-left: auto;">
                <button class="main-btn" id="bili-speed-btn" style="width: 60px; padding: 6px; margin-left: 8px;">应用</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);

    // --- 拖拽与最小化逻辑 ---
    const panel = document.getElementById('bili-study-helper');
    const header = document.getElementById('bili-header');
    let isDrag = false, hasMoved = false, startX, startY, initLeft, initTop;
    document.getElementById('bili-mini-btn').onclick = (e) => { e.stopPropagation(); panel.classList.add('minimized'); };
    document.getElementById('bili-stats-btn').onclick = (e) => { e.stopPropagation(); GM_openInTab(DASHBOARD_FULL_URL, { active: true }); };
    header.onmousedown = (e) => { if(e.target.className.includes('header-btn')) return; isDrag = true; hasMoved = false; startX = e.clientX; startY = e.clientY; const rect = panel.getBoundingClientRect(); initLeft = rect.left; initTop = rect.top; panel.style.right = 'auto'; panel.style.bottom = 'auto'; panel.style.left = initLeft + 'px'; panel.style.top = initTop + 'px'; document.body.style.cursor = 'move'; };
    panel.onmousedown = (e) => { if(panel.classList.contains('minimized')) { isDrag = true; hasMoved = false; startX = e.clientX; startY = e.clientY; const rect = panel.getBoundingClientRect(); initLeft = rect.left; initTop = rect.top; panel.style.right = 'auto'; panel.style.bottom = 'auto'; panel.style.left = initLeft + 'px'; panel.style.top = initTop + 'px'; document.body.style.cursor = 'move'; } };
    document.onmousemove = (e) => { if(!isDrag) return; e.preventDefault(); const dx = e.clientX - startX; const dy = e.clientY - startY; if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { hasMoved = true; } panel.style.left = (initLeft + dx) + 'px'; panel.style.top = (initTop + dy) + 'px'; };
    document.onmouseup = () => { isDrag = false; document.body.style.cursor = 'default'; };
    panel.onclick = (e) => { if(panel.classList.contains('minimized')) { if (hasMoved) { hasMoved = false; return; } panel.classList.remove('minimized'); } };

    // ==========================================
    // ⏱️ 全自动观看时长记录 (静默后台运行)
    // ==========================================
    setInterval(() => {
        const video = document.querySelector('video');
        // 当视频存在且处于正在播放状态（非暂停、非结束）时，自动累加秒数
        if (video && !video.paused && !video.ended) {
            const key = getTodayKey();
            const log = GM_getValue('studyLog', {});
            log[key] = (log[key] || 0) + 1;
            GM_setValue('studyLog', log);
        }
    }, 1000); // 每秒检测并更新一次

    // ==========================================
    // ⚙️ 自动集数与倍速
    // ==========================================
    let hasUserSetEnd = false;
    let userCustomSpeed = null; // 倍速锁定标志位

    // 核心修复点：全局拦截用户的点击事件，检测是否点击了B站自带的倍速菜单
    // 设置为捕获阶段(true)防止被B站前端代码阻止事件冒泡
    document.addEventListener('click', (e) => {
        const speedItem = e.target.closest('.bpx-player-ctrl-playbackrate-menu-item') || e.target.closest('.squirtle-select-item');
        if (speedItem) {
            // 用户手动点击了B站原生的倍速选项，解除脚本自定义倍速的强力锁定！
            userCustomSpeed = null;
        }
    }, true);

    document.getElementById('bili-end').addEventListener('input', () => {
        hasUserSetEnd = true;
    });

    document.getElementById('bili-speed-btn').onclick = () => {
        const speedVal = parseFloat(document.getElementById('bili-custom-speed').value);
        if (isNaN(speedVal) || speedVal < 2 || speedVal > 4) {
            alert("请输入 2 到 4 之间的有效倍速哦~");
            return;
        }
        userCustomSpeed = speedVal; // 重新锁定
        applyPlaybackRate(speedVal);
    };

    function applyPlaybackRate(rate) {
        const video = document.querySelector('video');
        if (video) {
            video.playbackRate = rate;
            const label = document.querySelector('.bpx-player-ctrl-playbackrate-result');
            if (label) label.innerText = rate + 'x';
        }
    }

    function getActiveEpisodeIndex() {
        let activeEl = document.querySelector('.video-pod__item.active') || document.querySelector('.list-box li.on') || document.querySelector('li[data-select="true"]');
        if (activeEl) {
            const text = activeEl.innerText;
            const match = text.match(/^(\d+)/);
            if (match) return parseInt(match[1]);
            let idx = 0; let el = activeEl;
            while ((el = el.previousElementSibling) != null) idx++;
            return idx + 1;
        }
        const pParam = new URLSearchParams(location.search).get('p');
        return pParam ? parseInt(pParam) : -1;
    }

    function systemMonitor() {
        const currentIdx = getActiveEpisodeIndex();

        if (currentIdx !== -1 && currentIdx !== lastEpisodeIndex) {
            if (currentIdx > 0) {
                 const s = document.getElementById('bili-start');
                 const e = document.getElementById('bili-end');

                 if(s && parseInt(s.value) !== currentIdx) s.value = currentIdx;

                 if(e && !hasUserSetEnd && parseInt(e.value) !== currentIdx) {
                     e.value = currentIdx;
                 }
            }
            lastEpisodeIndex = currentIdx;
            const box = document.getElementById('bili-result-box');
            if(box) box.style.display = 'none';
        }

        // 持续锁定检测
        if (userCustomSpeed !== null) {
            const video = document.querySelector('video');
            if (video && video.playbackRate !== userCustomSpeed) {
                applyPlaybackRate(userCustomSpeed);
            }
        }

        // 依然保留为你注入 1.75 倍速快捷选项的功能
        const menu = document.querySelector('.bpx-player-ctrl-playbackrate-menu, .squirtle-select-list');
        if (menu && !menu.querySelector('[data-value="1.75"]')) {
             const item = document.createElement('li');
             item.className = 'bpx-player-ctrl-playbackrate-menu-item';
             item.innerText = '1.75x';
             item.setAttribute('data-value', '1.75');
             item.onclick = function() {
                 userCustomSpeed = null; // 解除锁定
                 applyPlaybackRate(1.75);
             };
             let refNode = null;
             for (const child of menu.children) {
                 const val = parseFloat(child.getAttribute('data-value'));
                 if (!isNaN(val) && val < 1.75) {
                     refNode = child;
                     break;
                 }
             }
             menu.insertBefore(item, refNode);
        }
    }
    let lastEpisodeIndex = -1;
    setInterval(systemMonitor, 1500);

    // ==========================================
    // 🧮 计算时长功能
    // ==========================================
    document.getElementById('bili-calc-btn').onclick = () => {
        const sInput = parseInt(document.getElementById('bili-start').value);
        const eInput = parseInt(document.getElementById('bili-end').value);
        const box = document.getElementById('bili-result-box');
        let items = document.querySelectorAll('.video-pod__item');
        if(!items.length) items = document.querySelectorAll('.list-box li');
        if(!items.length) { box.style.display='block'; box.innerHTML="<span style='color:red'>列表未加载</span>"; return; }
        let total=0, count=0;
        items.forEach(item => {
            const txt = item.innerText;
            const titleMatch = txt.match(/^(\d+)/);
            let currentNum = titleMatch ? parseInt(titleMatch[1]) : -1;
            if (currentNum !== -1 && currentNum >= sInput && currentNum <= eInput) {
                const m = txt.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
                if(m) {
                    const p = m[0].split(':').map(Number);
                    total += p.length===3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+p[1];
                    count++;
                }
            }
        });
        box.style.display='block';
        if(count===0) box.innerHTML = "无数据 (未匹配到序号)";
        else box.innerHTML = `<div class="result-line">✅ 统计：第${sInput}-${eInput}集 (${count}集)</div><div class="result-highlight">${formatSecondsToHMS(total)}</div>`;
    };

})();