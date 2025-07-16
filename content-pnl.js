(function() {
    'use strict';
    
    const UPDATE_INTERVAL = 1500;
    const PRICE_UPDATE_INTERVAL = 60000;
    let currentBalance = 0;
    let baseBalance = 0;
    let solPrice = 0;
    let trackerElement = null;
    let isHovering = false;
    let walletAddress = '';
    let notificationShown = false;
    let balanceThreshold = 1.000; // Порог по умолчанию
    let updateTrackerTimeout = null; // Для хранения setTimeout
    let updatePriceTimeout = null; // Для хранения setTimeout

    // Проверка действительности контекста расширения
    function isExtensionContextValid() {
        return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    }

    // Подключаем шрифт
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Tilt+Warp&display=swap';
    document.head.appendChild(fontLink);

    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        :root {
            --font-tilt-warp: 'Tilt Warp', system-ui, sans-serif;
            --base-font-size: 12px;
            --scale-factor: 1;
        }
        .font-tilt { 
            font-family: var(--font-tilt-warp); 
            font-feature-settings: 'kern' 1;
        }
        #pnl-tracker {
            background: #1e1f25;
            position: fixed;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            z-index: 999999;
            resize: both;
            overflow: hidden;
            font-family: var(--font-tilt-warp);
            transition: border-color 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            font-size: calc(var(--base-font-size) * var(--scale-factor));
            min-width: 175px;
            min-height: 85px;
            cursor: move;
            border: 1px solid #333;
        }
        #pnl-tracker::-webkit-resizer {
            display: none;
        }
        #pnl-tracker:hover .pnl-reset-button {
            opacity: 0.7;
        }
        #pnl-tracker:hover .pnl-reset-button:hover {
            opacity: 1;
            background: #2a2b33;
        }
        .pnl-reset-button {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s ease;
            background: #1e1f25;
            border-radius: 50%;
            padding: 2px;
            box-shadow: 0 0 5px rgba(0,0,0,0.5);
            z-index: 100;
        }
        .pnl-content {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            gap: 6px;
        }
        .pnl-section {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1;
            align-items: center;
        }
        .pnl-label {
            color: #aaa;
            font-size: 0.9em;
            margin-bottom: 3px;
        }
        .pnl-value {
            font-size: 1.6em;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .pnl-footer {
            font-size: 0.9em;
            color: #777;
            margin-top: 2px;
        }
        #pnl-tracker::after {
            content: '';
            position: absolute;
            bottom: 0px;
            right: 0px;
            width: 12px;
            height: 12px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #444 50%);
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
            pointer-events: none;
        }
        #pnl-tracker:hover::after {
            opacity: 1;
        }
        #balance-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100%);
            background: #8e2a2aff;
            border: 2px solid #bc3b3bff;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            transition: transform 0.3s ease-in-out;
        }
        #balance-notification.show {
            transform: translateX(-50%) translateY(0);
        }
        #balance-notification .close-btn {
            margin-left: 15px;
            cursor: pointer;
            font-size: 1.2em;
            color: white;
        }
        #balance-notification .danger-sign {
            margin-right: 10px;
            font-size: 1.5em;
        }
    `;
    document.head.appendChild(style);

    const notificationSound = new Audio('https://www.soundjay.com/button/sounds/button-3.mp3');

    function createSolIcon() {
        const icon = document.createElement('img');
        icon.alt = 'sol';
        icon.decoding = 'async';
        icon.style.cssText = `
            width: 0.6em;
            height: 0.6em;
            margin-left: 4px;
        `;
        icon.src = 'https://solana.com/src/img/branding/solanaLogoMark.svg';
        return icon;
    }

    function createUsdcIcon() {
        const icon = document.createElement('img');
        icon.alt = 'usdc';
        icon.decoding = 'async';
        icon.style.cssText = `
            width: 0.8em;
            height: 0.8em;
            margin-left: 4px;
            border-radius: 50%;
        `;
        icon.src = 'https://cryptach.org/crypto-logo/usd-coin-usdc-logo.svg';
        return icon;
    }

    function createTracker() {
        trackerElement = document.createElement('div');
        trackerElement.id = 'pnl-tracker';
        trackerElement.classList.add('font-tilt');
        trackerElement.style.setProperty('--scale-factor', '1');

        if (isExtensionContextValid()) {
            chrome.storage.local.get(['trackerPosition'], (result) => {
                if (!isExtensionContextValid()) return;
                const defaultPosition = { top: 100, left: 20, width: 175, height: 85 };
                const savedPosition = result.trackerPosition || defaultPosition;
                trackerElement.style.top = `${savedPosition.top}px`;
                trackerElement.style.left = `${savedPosition.left}px`;
                trackerElement.style.width = `${savedPosition.width}px`;
                trackerElement.style.height = `${savedPosition.height}px`;
            });
        }

        const resetBtn = document.createElement('div');
        resetBtn.className = 'pnl-reset-button';
        resetBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V1L7 6l5 5V7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5H5c0 3.9 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7z" 
                      fill="#e74c3c"/>
            </svg>
        `;
        resetBtn.title = 'Reset PnL';
        resetBtn.addEventListener('dblclick', resetPnL);

        const content = document.createElement('div');
        content.className = 'pnl-content';

        const balanceSection = document.createElement('div');
        balanceSection.className = 'pnl-section';
        
        const balanceLabel = document.createElement('div');
        balanceLabel.className = 'pnl-label';
        balanceLabel.textContent = 'CURRENT';
        
        const balanceValue = document.createElement('div');
        balanceValue.className = 'pnl-value';
        
        const balanceValueText = document.createElement('span');
        balanceValueText.className = 'balance-value';
        balanceValueText.textContent = '0.000';
        
        balanceValue.appendChild(balanceValueText);
        balanceValue.appendChild(createSolIcon());
        
        const balanceFooter = document.createElement('div');
        balanceFooter.className = 'pnl-footer';
        balanceFooter.textContent = 'Balance';
        
        balanceSection.appendChild(balanceLabel);
        balanceSection.appendChild(balanceValue);
        balanceSection.appendChild(balanceFooter);

        const pnlSection = document.createElement('div');
        pnlSection.className = 'pnl-section';
        
        const pnlLabel = document.createElement('div');
        pnlLabel.className = 'pnl-label';
        pnlLabel.textContent = 'P&L';
        
        const pnlValue = document.createElement('div');
        pnlValue.className = 'pnl-value';
        pnlValue.id = 'delta-value';
        
        const pnlValueText = document.createElement('span');
        pnlValueText.className = 'delta-value';
        pnlValueText.textContent = '0.000';
        
        pnlValue.appendChild(pnlValueText);
        pnlValue.appendChild(createSolIcon());
        
        const pnlFooter = document.createElement('div');
        pnlFooter.className = 'pnl-footer';
        pnlFooter.id = 'base-balance';
        pnlFooter.textContent = 'Base: 0.000';
        
        pnlSection.appendChild(pnlLabel);
        pnlSection.appendChild(pnlValue);
        pnlSection.appendChild(pnlFooter);

        content.appendChild(balanceSection);
        content.appendChild(pnlSection);

        trackerElement.appendChild(resetBtn);
        trackerElement.appendChild(content);
        document.body.appendChild(trackerElement);

        setupDragging();
        setupResizeObserver();
        
        trackerElement.addEventListener('mouseenter', () => {
            isHovering = true;
            switchToUSDC();
        });
        
        trackerElement.addEventListener('mouseleave', () => {
            isHovering = false;
            switchToSOL();
        });
        
        return trackerElement;
    }

    function setupDragging() {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        trackerElement.addEventListener('mousedown', e => {
            try {
                const target = e.target instanceof Element ? e.target : document.body;
                if (target.closest('.pnl-reset-button')) return;
                
                const rect = trackerElement.getBoundingClientRect();
                const isResizeArea = 
                    e.clientX > rect.right - 20 &&
                    e.clientY > rect.bottom - 20;
                
                if (isResizeArea) return;
                
                isDragging = true;
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                document.body.style.userSelect = 'none';
                trackerElement.style.cursor = 'grabbing';
            } catch (e) {
                console.error('Drag start error:', e);
            }
        });

        document.addEventListener('mousemove', e => {
            if (isDragging) {
                trackerElement.style.left = (e.clientX - offsetX) + 'px';
                trackerElement.style.top = (e.clientY - offsetY) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                trackerElement.style.cursor = 'move';
                saveTrackerPosition();
            }
        });
    }

    function saveTrackerPosition() {
        if (!trackerElement || !isExtensionContextValid()) return;
        
        const position = {
            top: parseInt(trackerElement.style.top) || 100,
            left: parseInt(trackerElement.style.left) || 20,
            width: trackerElement.offsetWidth,
            height: trackerElement.offsetHeight
        };
        
        chrome.storage.local.set({ trackerPosition: position });
    }

    function setupResizeObserver() {
        if (!trackerElement) return;
        
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                const baseWidth = 175;
                const baseHeight = 85;
                const widthRatio = width / baseWidth;
                const heightRatio = height / baseHeight;
                const scaleFactor = Math.min(widthRatio, heightRatio, 1.8);
                
                trackerElement.style.setProperty('--scale-factor', Math.max(0.8, scaleFactor));
                saveTrackerPosition();
            }
        });
        
        observer.observe(trackerElement);
    }

    function resetPnL() {
        baseBalance = currentBalance;
        if (isExtensionContextValid()) {
            chrome.storage.local.set({ baseBalance });
        }
        updateValues();
    }

    function updateValues() {
        if (!trackerElement) return;
        
        const delta = currentBalance - baseBalance;
        const balanceEl = trackerElement.querySelector('.balance-value');
        const deltaEl = trackerElement.querySelector('.delta-value');
        const baseEl = trackerElement.querySelector('#base-balance');

        if (balanceEl && deltaEl && baseEl) {
            if (isHovering && solPrice > 0) {
                balanceEl.style.color = 'white';
                balanceEl.textContent = (currentBalance * solPrice).toFixed(2);
                deltaEl.textContent = (delta >= 0 ? '+' : '') + (delta * solPrice).toFixed(2);
                baseEl.textContent = `Base: ${(baseBalance * solPrice).toFixed(2)}`;
            } else {
                balanceEl.style.color = 'white';
                balanceEl.textContent = currentBalance.toFixed(3);
                deltaEl.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(3);
                baseEl.textContent = `Base: ${baseBalance.toFixed(3)}`;
            }

            const deltaValue = isHovering ? delta * solPrice : delta;
            trackerElement.querySelector('#delta-value').style.color = 
                deltaValue >= 0 ? '#2ecc71' : '#e74c3c';
        }
    }

    function switchToUSDC() {
        if (!trackerElement || solPrice <= 0) return;
        
        const icons = trackerElement.querySelectorAll('.pnl-value > img');
        if (icons.length) {
            icons.forEach(icon => {
                icon.src = 'https://cryptach.org/crypto-logo/usd-coin-usdc-logo.svg';
                icon.style.borderRadius = '50%';
            });
            updateValues();
        }
    }

    function switchToSOL() {
        if (!trackerElement) return;
        
        const icons = trackerElement.querySelectorAll('.pnl-value > img');
        if (icons.length) {
            icons.forEach(icon => {
                icon.src = 'https://solana.com/src/img/branding/solanaLogoMark.svg';
                icon.style.borderRadius = '0';
            });
            updateValues();
        }
    }

    async function fetchBalance() {
        try {
            if (!walletAddress) return 0;
            
            const response = await fetch(
                `https://www.bloombot.app/api/balance?wallet=${walletAddress}&chain=sol`
            );
            const data = await response.json();
            return parseFloat(data.balance) || 0;
        } catch (e) {
            console.error('Error fetching balance:', e);
            return currentBalance;
        }
    }

    async function fetchSolPrice() {
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
            );
            const data = await response.json();
            return data.solana?.usd || 0;
        } catch (e) {
            console.error('Error fetching SOL price:', e);
            return 0;
        }
    }

    async function updateTrackerData() {
        if (!trackerElement || !walletAddress || !isExtensionContextValid()) return;
        
        currentBalance = await fetchBalance();
        if (isExtensionContextValid()) {
            chrome.storage.local.set({ currentBalance });
        }
        updateValues();

        // Проверка баланса и вызов уведомления
        if (currentBalance < balanceThreshold && !notificationShown) {
            showNotification();
            notificationShown = true;
        } else if (currentBalance >= balanceThreshold) {
            notificationShown = false; // Сбрасываем флаг
        }
        
        updateTrackerTimeout = setTimeout(updateTrackerData, UPDATE_INTERVAL);
    }

    async function updateSolPrice() {
        if (!isExtensionContextValid()) return;
        
        solPrice = await fetchSolPrice();
        if (isHovering) updateValues();
        updatePriceTimeout = setTimeout(updateSolPrice, PRICE_UPDATE_INTERVAL);
    }

    function loadPnlState() {
        try {
            if (isExtensionContextValid()) {
                chrome.storage.local.get(
                    ['baseBalance', 'currentBalance', 'pnlSettings'],
                    (result) => {
                        if (!isExtensionContextValid()) return;
                        baseBalance = result.baseBalance || 0;
                        currentBalance = result.currentBalance || 0;
                        balanceThreshold = result.pnlSettings?.balanceThreshold || 1.000;
                    }
                );
            }
        } catch (e) {
            console.error('Error loading PnL state:', e);
        }
    }

    function initPnlTracker() {
        loadPnlState();
        
        if (isExtensionContextValid()) {
            chrome.storage.local.get(
                ['pnlSettings'],
                (result) => {
                    try {
                        if (!isExtensionContextValid()) return;
                        const settings = result.pnlSettings || {};
                        if (settings.enabled && settings.walletAddress) {
                            walletAddress = settings.walletAddress;
                            balanceThreshold = settings.balanceThreshold || 1.000;
                            createTracker();
                            updateValues();
                            updateTrackerData();
                            updateSolPrice();
                        }
                    } catch (e) {
                        console.error('Tracker init error:', e);
                    }
                }
            );
        }
    }

    chrome.runtime.onMessage.addListener((request) => {
        try {
            if (!isExtensionContextValid()) return;
            if (request.action === 'updatePnlSettings') {
                const settings = request.settings;
                chrome.storage.local.set({ pnlSettings: settings });
                
                if (settings.enabled && settings.walletAddress) {
                    walletAddress = settings.walletAddress;
                    balanceThreshold = settings.balanceThreshold || 1.000;
                    chrome.storage.local.set({ 
                        baseBalance,
                        currentBalance
                    });
                    
                    if (!trackerElement) {
                        initPnlTracker();
                    } else {
                        trackerElement.style.display = 'block';
                        updateTrackerData();
                        updateSolPrice();
                    }
                } else if (trackerElement) {
                    chrome.storage.local.set({ 
                        baseBalance,
                        currentBalance
                    });
                    trackerElement.style.display = 'none';
                }
            }
        } catch (e) {
            console.error('Error handling runtime message:', e);
        }
    });

    // Очистка таймеров при выгрузке страницы
    window.addEventListener('unload', () => {
        if (updateTrackerTimeout) clearTimeout(updateTrackerTimeout);
        if (updatePriceTimeout) clearTimeout(updatePriceTimeout);
    });

    loadPnlState();

    document.addEventListener('selectstart', (e) => {
        const target = e.target instanceof Element ? e.target : document.body;
        if (target.closest('#pnl-tracker')) {
            e.preventDefault();
        }
    }, false);
    
    window.addEventListener('load', initPnlTracker);

    // Функция отображения уведомления
    function showNotification() {
        const notification = document.createElement('div');
        notification.id = 'balance-notification';
        notification.innerHTML = `
            <span class="danger-sign">⚠️</span>
            <span>Your balance is below ${balanceThreshold.toFixed(3)} SOL! Consider taking a break.</span>
            <span class="close-btn">×</span>
        `;

        document.body.appendChild(notification);

        notificationSound.play();

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        const autoCloseTimeout = setTimeout(() => {
            closeNotification(notification);
        }, 5000);

        notification.querySelector('.close-btn').addEventListener('click', () => {
            clearTimeout(autoCloseTimeout);
            closeNotification(notification);
        });
    }

    function closeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
})();