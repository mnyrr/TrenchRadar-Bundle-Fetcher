// content.js
(function() {
    'use strict';

    // Переменные для отслеживания активных запросов
    let activeRequests = [];
    let isPopupOpen = false;
    let currentTokenAddress = null;

    // Добавляем переменные для управления автообновлением
    let autoRefreshInterval = null;
    let autoRefreshTimeout = null;
    let isAutoRefreshActive = false; // Флаг для отслеживания состояния автообновления

    // Глобальная переменная для управления тултипами
    let activeTooltip = null;

    // Функция для создания тултипов
    function createTooltip(element, text) {
        element.addEventListener('mouseenter', (e) => {
            // Удаляем существующий тултип, если есть
            if (activeTooltip) {
                activeTooltip.remove();
            }
            
            // Создаем новый тултип
            const tooltip = document.createElement('div');
            tooltip.textContent = text;
            tooltip.style.position = 'fixed';
            tooltip.style.backgroundColor = 'rgba(0,0,0,0.9)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '6px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.fontFamily = "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
            tooltip.style.zIndex = '1000000';
            tooltip.style.boxShadow = '0 3px 10px rgba(0,0,0,0.5)';
            tooltip.style.whiteSpace = 'nowrap';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.opacity = '0';
            tooltip.style.transition = 'opacity 0.15s ease';
            tooltip.style.display = 'block';
            
            document.body.appendChild(tooltip);
            activeTooltip = tooltip;
            
            // Позиционируем тултип
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width/2}px`;
            tooltip.style.top = `${rect.top - 10}px`;
            tooltip.style.transform = 'translate(-50%, -100%)';
            
            // Показываем с анимацией
            setTimeout(() => tooltip.style.opacity = '1', 10);
        });
        
        element.addEventListener('mouseleave', () => {
            if (activeTooltip) {
                activeTooltip.style.opacity = '0';
                setTimeout(() => {
                    if (activeTooltip && activeTooltip.parentNode) {
                        activeTooltip.parentNode.removeChild(activeTooltip);
                        activeTooltip = null;
                    }
                }, 150);
            }
        });
        
        element.addEventListener('mousemove', (e) => {
            if (activeTooltip) {
                const rect = element.getBoundingClientRect();
                activeTooltip.style.left = `${rect.left + rect.width/2}px`;
                activeTooltip.style.top = `${rect.top - 10}px`;
            }
        });
    }

    // Добавляем стили для анимации
const animationStyle = document.createElement('style');
animationStyle.textContent = `
    @keyframes trench-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.4); }
        100% { transform: scale(1); }
    }
    @keyframes trench-rotate {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .trench-refreshing {
        animation: trench-pulse 0.5s ease-in-out;
    }
    .trench-refreshing .trench-arrow {
        animation: trench-rotate 0.5s linear;
        transform-origin: 12px 12px; /* Добавленная строка */
    }
`;

    document.head.appendChild(animationStyle);

    // Функция для остановки автообновления
    function stopAutoRefresh() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        if (autoRefreshTimeout) {
            clearTimeout(autoRefreshTimeout);
            autoRefreshTimeout = null;
        }
        
        isAutoRefreshActive = false; // Сбрасываем флаг
        
        // Обновляем состояние кнопки
        const autoRefreshBtn = document.getElementById('trench-auto-refresh-btn');
        if (autoRefreshBtn) {
            autoRefreshBtn.classList.remove('active');
            autoRefreshBtn.style.backgroundColor = 'transparent';
            autoRefreshBtn.style.border = 'none';
            autoRefreshBtn.querySelector('svg path').style.stroke = '#ddd';
        }
    }

    // Функция для запуска автообновления
    function startAutoRefresh() {
        // Останавливаем предыдущее автообновление, если было
        stopAutoRefresh();
        
        isAutoRefreshActive = true; // Устанавливаем флаг
        
        // Обновляем состояние кнопки
        const autoRefreshBtn = document.getElementById('trench-auto-refresh-btn');
        if (autoRefreshBtn) {
            autoRefreshBtn.classList.add('active');
            autoRefreshBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            autoRefreshBtn.querySelector('svg path').style.stroke = '#4CAF50';
        }
        
        // Запускаем автообновление каждые 5 секунд
        autoRefreshInterval = setInterval(() => {
            if (currentTokenAddress && isPopupOpen) {
                fetchTrenchBotBundles(currentTokenAddress, true);
            }
        }, 5000);
        
        // Останавливаем через 2 минуты (120 секунд)
        autoRefreshTimeout = setTimeout(() => {
            stopAutoRefresh();
        }, 120000);
    }

    // Функция для закрытия попапа
    function closeInfoPopup() {
        const infoDiv = document.getElementById('trench-info-div');
        if (infoDiv && infoDiv.style.display !== 'none') {
            infoDiv.style.opacity = '0';
            setTimeout(() => { 
                infoDiv.style.display = 'none';
                isPopupOpen = false;
                
                // Отменяем все активные запросы
                activeRequests.forEach(requestId => {
                    chrome.runtime.sendMessage({ action: 'abortRequest', requestId });
                });
                activeRequests = [];
                
                // Останавливаем автообновление
                stopAutoRefresh();
            }, 300);
        }
    }

    // Закрытие попапа при изменении URL
    function handleUrlChange() {
        closeInfoPopup();
    }

    // Функции для управления оверлеем
    function showOverlay() {
        const overlay = document.getElementById('trench-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.style.opacity = '1', 10);
        }
    }

    function hideOverlay() {
        const overlay = document.getElementById('trench-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }

    function createOrUpdateInfo(data) {
    
    let div = document.getElementById('trench-info-div');
    const button = document.getElementById('trench-check-btn');

    if (!div) {
        div = document.createElement('div');
        div.id = 'trench-info-div';
        Object.assign(div.style, {
            position: 'fixed',
            width: '342px',
            maxHeight: '95vh',
            overflowY: 'auto',
            padding: '0',
            backgroundColor: 'rgba(33,33,33,0.98)',
            color: 'white',
            fontSize: '12.6px',
            fontWeight: '500',
            borderRadius: '6px',
            zIndex: '99999',
            cursor: 'default',
            display: 'none',
            fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            boxShadow: '0 4px 18px rgba(0,0,0,0.63)',
            border: '1.8px solid rgba(139, 101, 255, 0.27)',
            outline: '1.8px solid rgba(255, 255, 255, 0.09)',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        document.body.appendChild(div);
    } else {
        div.innerHTML = '';
    }

    // Фиксированное позиционирование в правом верхнем углу
    div.style.position = 'fixed';
    div.style.top = '36px';
    div.style.right = '18px';
    div.style.left = 'auto';
    div.style.bottom = 'auto';

    if (typeof data === 'string' || (data && data.error)) {
        // Показ сообщения об ошибке
        const errorMessage = typeof data === 'string' ? data : data.error;
        
        const errorContainer = document.createElement('div');
        errorContainer.style.padding = '27px 18px';
        errorContainer.style.textAlign = 'center';
        
        const errorIcon = document.createElement('div');
        errorIcon.textContent = '❌';
        errorIcon.style.fontSize = '36px';
        errorIcon.style.marginBottom = '18px';
        errorIcon.style.color = '#f44336';
        
        const errorText = document.createElement('div');
        errorText.textContent = errorMessage;
        errorText.style.fontSize = '14.4px';
        errorText.style.color = '#f44336';
        errorText.style.fontWeight = '600';
        errorText.style.whiteSpace = 'pre-line';
        
        errorContainer.appendChild(errorIcon);
        errorContainer.appendChild(errorText);
        div.appendChild(errorContainer);
        
        div.style.display = 'block';
        setTimeout(() => div.style.opacity = '1', 10);
        isPopupOpen = true;
        return;
    } else if (data && data.loading) {
        // Стильный индикатор загрузки
        
        const loadingContainer = document.createElement('div');
        loadingContainer.style.padding = '27px 18px';
        loadingContainer.style.textAlign = 'center';
        
        const spinnerContainer = document.createElement('div');
        spinnerContainer.style.display = 'inline-block';
        spinnerContainer.style.position = 'relative';
        spinnerContainer.style.width = '72px';
        spinnerContainer.style.height = '72px';
        
        const spinner = document.createElement('div');
        spinner.style.position = 'absolute';
        spinner.style.width = '57.6px';
        spinner.style.height = '57.6px';
        spinner.style.margin = '7.2px';
        spinner.style.border = '5.4px solid rgba(139, 101, 255, 0.27)';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTopColor = '#8e2de2';
        spinner.style.animation = 'spin 1s ease-in-out infinite';
        
        const innerSpinner = document.createElement('div');
        innerSpinner.style.position = 'absolute';
        innerSpinner.style.width = '36px';
        innerSpinner.style.height = '36px';
        innerSpinner.style.margin = '18px';
        innerSpinner.style.border = '3.6px solid rgba(139, 101, 255, 0.27)';
        innerSpinner.style.borderRadius = '50%';
        innerSpinner.style.borderTopColor = '#4a00e0';
        innerSpinner.style.animation = 'spinReverse 1.2s ease-in-out infinite';
        
        const loadingText = document.createElement('div');
        loadingText.textContent = data.message || 'Loading...';
        loadingText.style.marginTop = '18px';
        loadingText.style.fontSize = '14.4px';
        loadingText.style.fontWeight = '600';
        loadingText.style.color = '#bbb';
        loadingText.style.letterSpacing = '0.9px';
        
        // Добавляем CSS анимацию
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes spinReverse {
                to { transform: rotate(-360deg); }
            }
        `;
        
        spinnerContainer.appendChild(spinner);
        spinnerContainer.appendChild(innerSpinner);
        loadingContainer.appendChild(style);
        loadingContainer.appendChild(spinnerContainer);
        loadingContainer.appendChild(loadingText);
        div.appendChild(loadingContainer);
        
        div.style.display = 'block';
        setTimeout(() => div.style.opacity = '1', 10);
        isPopupOpen = true;
        return;
    }

        // Создаем оверлей для загрузки
        if (!div.querySelector('#trench-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'trench-overlay';
            Object.assign(overlay.style, {
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                zIndex: '1',
                display: 'none',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: '0',
                transition: 'opacity 0.3s ease',
                borderRadius: '6px'
            });

            // Добавляем анимацию загрузки в оверлей
            const spinnerContainer = document.createElement('div');
            spinnerContainer.style.display = 'inline-block';
            spinnerContainer.style.position = 'relative';
            spinnerContainer.style.width = '72px'; // Уменьшено на 10%
            spinnerContainer.style.height = '72px'; // Уменьшено на 10%
            
            const spinner = document.createElement('div');
            spinner.style.position = 'absolute';
            spinner.style.width = '57.6px'; // Уменьшено на 10%
            spinner.style.height = '57.6px'; // Уменьшено на 10%
            spinner.style.margin = '7.2px'; // Уменьшено на 10%
            spinner.style.border = '5.4px solid rgba(139, 101, 255, 0.27)'; // Уменьшено на 10%
            spinner.style.borderRadius = '50%';
            spinner.style.borderTopColor = '#8e2de2';
            spinner.style.animation = 'spin 1s ease-in-out infinite';
            
            const innerSpinner = document.createElement('div');
            innerSpinner.style.position = 'absolute';
            innerSpinner.style.width = '36px'; // Уменьшено на 10%
            innerSpinner.style.height = '36px'; // Уменьшено на 10%
            innerSpinner.style.margin = '18px'; // Уменьшено на 10%
            innerSpinner.style.border = '3.6px solid rgba(139, 101, 255, 0.27)'; // Уменьшено на 10%
            innerSpinner.style.borderRadius = '50%';
            innerSpinner.style.borderTopColor = '#4a00e0';
            innerSpinner.style.animation = 'spinReverse 1.2s ease-in-out infinite';
            
            const loadingText = document.createElement('div');
            loadingText.textContent = 'Refreshing...';
            loadingText.style.marginTop = '18px'; // Уменьшено на 10%
            loadingText.style.fontSize = '14.4px'; // Уменьшено на 10%
            loadingText.style.fontWeight = '600';
            loadingText.style.color = '#bbb';
            loadingText.style.letterSpacing = '0.9px'; // Уменьшено на 10%
            loadingText.style.textAlign = 'center';
            
            spinnerContainer.appendChild(spinner);
            spinnerContainer.appendChild(innerSpinner);
            overlay.appendChild(spinnerContainer);
            overlay.appendChild(loadingText);
            div.appendChild(overlay);
        }

        // Header (закрепленный)
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '10.8px 13.5px';
        header.style.borderBottom = '0.9px solid #444';
        header.style.background = 'linear-gradient(to right, #1a1a2e, #16213e)';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '2';

        const title = document.createElement('h2');
        title.innerHTML = `<span style="color: #eee; font-weight: 600;">TrenchRadar:</span> <span style="color: #4fc3f7; font-weight: 700;">$${data.tokenTicker}</span>`;
        title.style.margin = '0';
        title.style.fontSize = '16.2px';
        title.style.fontWeight = '600';

        // Создаем контейнер для кнопок
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '8px';

        // Кнопка автообновления
        const autoRefreshBtn = document.createElement('div');
        autoRefreshBtn.id = 'trench-auto-refresh-btn';
        autoRefreshBtn.style.cursor = 'pointer';
        autoRefreshBtn.style.width = '28.8px';
        autoRefreshBtn.style.height = '28.8px';
        autoRefreshBtn.style.display = 'flex';
        autoRefreshBtn.style.alignItems = 'center';
        autoRefreshBtn.style.justifyContent = 'center';
        autoRefreshBtn.style.transition = 'all 0.2s';
        autoRefreshBtn.style.borderRadius = '3.6px';
        autoRefreshBtn.style.color = '#ddd';

        // SVG для кнопки автообновления (часы)
        autoRefreshBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
                <path class="trench-arrow" d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        // Создаем тултип для кнопки автообновления
        createTooltip(autoRefreshBtn, 'Auto-refresh every 5 seconds (max 2 minutes)');

        // Восстанавливаем состояние кнопки при пересоздании попапа
        if (isAutoRefreshActive) {
            autoRefreshBtn.classList.add('active');
            autoRefreshBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
            autoRefreshBtn.querySelector('svg path').style.stroke = '#4CAF50';
        }

        autoRefreshBtn.addEventListener('mouseover', () => {
            if (autoRefreshBtn.classList.contains('active')) {
                autoRefreshBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
                autoRefreshBtn.querySelector('svg path').style.stroke = '#66BB6A';
            } else {
                autoRefreshBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
                autoRefreshBtn.querySelector('svg path').style.stroke = '#fff';
            }
        });

        autoRefreshBtn.addEventListener('mouseout', () => {
            if (autoRefreshBtn.classList.contains('active')) {
                autoRefreshBtn.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                autoRefreshBtn.querySelector('svg path').style.stroke = '#4CAF50';
            } else {
                autoRefreshBtn.style.backgroundColor = 'transparent';
                autoRefreshBtn.querySelector('svg path').style.stroke = '#ddd';
            }
        });

        autoRefreshBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            if (autoRefreshBtn.classList.contains('active')) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
            }
        });

        // Кнопка ручного обновления
        const refreshBtn = document.createElement('div');
        refreshBtn.id = 'trench-refresh-btn';
        refreshBtn.style.cursor = 'pointer';
        refreshBtn.style.width = '28.8px';
        refreshBtn.style.height = '28.8px';
        refreshBtn.style.display = 'flex';
        refreshBtn.style.alignItems = 'center';
        refreshBtn.style.justifyContent = 'center';
        refreshBtn.style.transition = 'all 0.2s';
        refreshBtn.style.borderRadius = '3.6px';
        refreshBtn.style.color = '#ddd';

        // Создаем тултип для кнопки обновления
        createTooltip(refreshBtn, 'Refresh data');

        // SVG для кнопки обновления (стрелка по кругу)
        refreshBtn.innerHTML += `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M23 4v6h-6M1 20v-6h6" stroke="#ddd" stroke-width="2" stroke-linecap="round"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke="#ddd" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `;

        refreshBtn.addEventListener('mouseover', () => {
            refreshBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
            refreshBtn.querySelector('svg path').style.stroke = '#fff';
        });

        refreshBtn.addEventListener('mouseout', () => {
            refreshBtn.style.backgroundColor = 'transparent';
            refreshBtn.querySelector('svg path').style.stroke = '#ddd';
        });

        refreshBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            if (currentTokenAddress) {
                showOverlay();
                fetchTrenchBotBundles(currentTokenAddress, false);
            }
        });

        // Кнопка закрытия
        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '25.2px';
        closeBtn.style.color = '#ddd';
        closeBtn.style.width = '28.8px';
        closeBtn.style.height = '28.8px';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.transition = 'all 0.2s';
        closeBtn.style.borderRadius = '3.6px';

        // Создаем тултип для кнопки закрытия
        createTooltip(closeBtn, 'Close');

        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.color = '#fff';
            closeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.color = '#ddd';
            closeBtn.style.backgroundColor = 'transparent';
        });
        closeBtn.addEventListener('click', closeInfoPopup);

        // Добавляем кнопки в контейнер в нужном порядке
        buttonsContainer.appendChild(autoRefreshBtn);
        buttonsContainer.appendChild(refreshBtn);
        buttonsContainer.appendChild(closeBtn);

        // Добавляем элементы в заголовок
        header.appendChild(title);
        header.appendChild(buttonsContainer); // Контейнер с кнопками справа

        div.appendChild(header);

        // Overall Stats
        const overallSection = document.createElement('section');
        overallSection.style.padding = '9px 13.5px'; // Уменьшено на 10%
        overallSection.style.borderBottom = '0.9px solid #444'; // Уменьшено на 10%

        const overallTitle = document.createElement('h3');
        overallTitle.innerHTML = '📊 <span style="border-bottom: 0.9px dashed #666; padding-bottom: 2.7px; font-weight: 600;">Overall Statistics</span>'; // Уменьшено на 10%
        overallTitle.style.marginTop = '2.7px'; // Уменьшено на 10%
        overallTitle.style.marginBottom = '7.2px'; // Уменьшено на 10%
        overallTitle.style.fontSize = '14.4px'; // Уменьшено на 10%
        overallTitle.style.color = '#ffb74d';
        overallTitle.style.fontWeight = '600';

        overallSection.appendChild(overallTitle);

        const stats = [
            { icon: '📦', label: 'Holding Bundles', value: data.overall.holdingBundles + ' (Holding) / ' + data.overall.totalBundles + ' (Total)', color: '#f15974', fontWeight: '600' },
            { icon: '💰', label: 'Total SOL Spent', value: data.overall.totalSol + ' SOL', color: '#fff', fontWeight: '600' },
            { icon: '📈', label: 'Current Held Percentage', value: data.overall.totalHolding + '%', color: '#f15974', fontWeight: '600' }
        ];

        stats.forEach(stat => {
            const statRow = document.createElement('div');
            statRow.style.display = 'flex';
            statRow.style.justifyContent = 'space-between';
            statRow.style.marginBottom = '2.7px'; // Уменьшено на 10%
            statRow.style.alignItems = 'center';
            statRow.style.padding = '4.5px 9px'; // Уменьшено на 10%

            const labelDiv = document.createElement('div');
            labelDiv.style.display = 'flex';
            labelDiv.style.alignItems = 'center';
            labelDiv.style.gap = '7.2px'; // Уменьшено на 10%
            labelDiv.style.fontWeight = '500';

            const iconSpan = document.createElement('span');
            iconSpan.textContent = stat.icon;
            iconSpan.style.fontSize = '16.2px'; // Уменьшено на 10%

            const textSpan = document.createElement('span');
            textSpan.textContent = stat.label;
            textSpan.style.fontWeight = '500';

            labelDiv.appendChild(iconSpan);
            labelDiv.appendChild(textSpan);

            const valueDiv = document.createElement('div');
            valueDiv.textContent = stat.value;
            valueDiv.style.fontWeight = stat.fontWeight || '600';
            valueDiv.style.color = stat.color;
            valueDiv.style.fontSize = '12.6px'; // Уменьшено на 10%

            statRow.appendChild(labelDiv);
            statRow.appendChild(valueDiv);
            overallSection.appendChild(statRow);
        });

        div.appendChild(overallSection);

        // Top Bundles
        const topSection = document.createElement('section');
        topSection.style.padding = '13.5px'; // Уменьшено на 10%

        const topTitle = document.createElement('h3');
        topTitle.innerHTML = '🏆 <span style="border-bottom: 0.9px dashed #666; padding-bottom: 2.7px; font-weight: 600;">Top 5 Holding Bundles</span>'; // Уменьшено на 10%
        topTitle.style.marginTop = '0';
        topTitle.style.marginBottom = '13.5px'; // Уменьшено на 10%
        topTitle.style.fontSize = '14.4px'; // Уменьшено на 10%
        topTitle.style.color = '#ffb74d';
        topTitle.style.fontWeight = '600';

        topSection.appendChild(topTitle);

        if (data.topBundles.length === 0) {
            const empty = document.createElement('div');
            empty.style.textAlign = 'center';
            empty.style.padding = '18px 0'; // Уменьшено на 10%
            empty.style.color = '#888';
            empty.textContent = 'No bundles holding tokens';
            topSection.appendChild(empty);
        } else {
            data.topBundles.forEach(bundle => {
                const bundleCard = document.createElement('div');
                bundleCard.style.borderRadius = '7.2px'; // Уменьшено на 10%
                bundleCard.style.padding = '7.2px 13.5px'; // Уменьшено на 10%
                bundleCard.style.marginBottom = '7.2px'; // Уменьшено на 10%
                bundleCard.style.boxShadow = '0 1.8px 4.5px rgba(0,0,0,0.18)'; // Уменьшено на 10%
                bundleCard.style.borderLeft = '2.7px solid #4a148c'; // Уменьшено на 10%

                // Определяем фон в зависимости от процента владения
                const holdingPerc = parseFloat(bundle.holdingPercentage);
                let bgColor;
                
                if (bundle.primaryCategory === 'new_wallet') {
                    if (holdingPerc === 0) {
                        // Зеленый для new_wallet с 0%
                        bgColor = 'rgba(76, 175, 80, 0.1)';
                    } else {
                        // Красный для new_wallet с любым процентом >0
                        bgColor = 'rgba(244, 67, 54, 0.1)';
                    }
                } else {
                    if (holdingPerc === 0) {
                        bgColor = 'rgba(76, 175, 80, 0.1)';
                    } else if (holdingPerc <= 4) {
                        bgColor = 'rgba(255, 193, 7, 0.1)';
                    } else {
                        bgColor = 'rgba(244, 67, 54, 0.1)';
                    }
                }
                
                bundleCard.style.backgroundColor = bgColor;

                const bundleHeader = document.createElement('div');
                bundleHeader.style.display = 'flex';
                bundleHeader.style.justifyContent = 'space-between';
                bundleHeader.style.alignItems = 'center';
                bundleHeader.style.marginBottom = '7.2px'; // Уменьшено на 10%

                const bundleTitle = document.createElement('div');
                bundleTitle.style.display = 'flex';
                bundleTitle.style.alignItems = 'center';
                bundleTitle.style.gap = '7.2px'; // Уменьшено на 10%

                const categoryEmoji = {
                    sniper: '🎯',
                    new_wallet: '🌱',
                    regular: '✅'
                }[bundle.primaryCategory] || '🔹';

                const emojiSpan = document.createElement('span');
                emojiSpan.textContent = categoryEmoji;
                emojiSpan.style.fontSize = '18px'; // Сохранен размер для эмодзи

                const idSpan = document.createElement('span');
                idSpan.textContent = `Slot ${bundle.id}`;
                idSpan.style.fontWeight = '600';
                idSpan.style.color = '#e1bee7';

                bundleTitle.appendChild(emojiSpan);
                bundleTitle.appendChild(idSpan);
                bundleHeader.appendChild(bundleTitle);

                const categorySpan = document.createElement('span');
                categorySpan.textContent = bundle.primaryCategory;
                categorySpan.style.background = '#4527a0';
                categorySpan.style.color = '#d1c4e9';
                categorySpan.style.padding = '2.7px 18px'; // Уменьшено на 10%
                categorySpan.style.borderRadius = '9px'; // Уменьшено на 10%
                categorySpan.style.fontSize = '12.6px'; // Уменьшено на 10%
                categorySpan.style.fontWeight = '600';
                bundleHeader.appendChild(categorySpan);

                bundleCard.appendChild(bundleHeader);

                const bundleStats = [
                    { icon: '👥', label: 'Unique Wallets', value: bundle.uniqueWallets, fontWeight: '600' },
                    { icon: '💸', label: 'SOL Spent', value: bundle.solSpent + ' SOL', fontWeight: '600' },
                    { icon: '📌', label: 'Remaining Supply', value: bundle.holdingPercentage + '%', fontWeight: '600', isSupply: true }
                ];

                bundleStats.forEach(stat => {
                    const statRow = document.createElement('div');
                    statRow.style.display = 'flex';
                    statRow.style.justifyContent = 'space-between';
                    statRow.style.marginBottom = '2.7px'; // Уменьшено на 10%
                    statRow.style.fontSize = '12.6px'; // Уменьшено на 10%

                    const labelDiv = document.createElement('div');
                    labelDiv.style.display = 'flex';
                    labelDiv.style.alignItems = 'center';
                    labelDiv.style.gap = '5.4px'; // Уменьшено на 10%
                    labelDiv.style.color = '#aaa';
                    labelDiv.style.fontWeight = '500';

                    const iconSpan = document.createElement('span');
                    iconSpan.textContent = stat.icon;

                    const textSpan = document.createElement('span');
                    textSpan.textContent = stat.label;

                    labelDiv.appendChild(iconSpan);
                    labelDiv.appendChild(textSpan);

                    const valueDiv = document.createElement('div');
                    valueDiv.textContent = stat.value;
                    valueDiv.style.fontWeight = stat.fontWeight || '600';

                    // Установка цвета для Remaining Supply
                    if (stat.isSupply) {
                        const percentage = parseFloat(bundle.holdingPercentage);
                        if (percentage > 4) {
                            valueDiv.style.color = '#f15974'; // розовый / красноватый
                        } else if (percentage === 0) {
                            valueDiv.style.color = '#4caf50'; // зеленый в тональности
                        } else {
                            valueDiv.style.color = '#fbc02d'; // желтый в тональности
                        }
                    } else {
                        valueDiv.style.color = '#fff';
                    }

                    statRow.appendChild(labelDiv);
                    statRow.appendChild(valueDiv);
                    bundleCard.appendChild(statRow);
                });

                // Индикатор прогресса
                const progressContainer = document.createElement('div');
                progressContainer.style.position = 'relative';
                progressContainer.style.width = '100%';
                progressContainer.style.height = '21.6px'; // Уменьшено на 10%
                progressContainer.style.backgroundColor = 'rgba(255,255,255,0.1)';
                progressContainer.style.borderRadius = '3.6px'; // Уменьшено на 10%
                progressContainer.style.marginTop = '9px'; // Уменьшено на 10%
                progressContainer.style.overflow = 'hidden';

                const progressBar = document.createElement('div');
                progressBar.style.width = Math.min(100, bundle.remainingBundlePercent) + '%';
                progressBar.style.height = '100%';
                progressBar.style.background = 'linear-gradient(to right, #4a00e0, #8e2de2)';
                progressBar.style.borderRadius = '3.6px'; // Уменьшено на 10%

                const progressText = document.createElement('div');
                progressText.textContent = `Remaining Bundle: ${bundle.remainingBundlePercent.toFixed(2)}%`;
                progressText.style.position = 'absolute';
                progressText.style.top = '0';
                progressText.style.left = '0';
                progressText.style.width = '100%';
                progressText.style.height = '100%';
                progressText.style.display = 'flex';
                progressText.style.alignItems = 'center';
                progressText.style.justifyContent = 'center';
                progressText.style.fontSize = '10.8px'; // Уменьшено на 10%
                progressText.style.fontWeight = '600';
                progressText.style.color = '#fff';
                progressText.style.textShadow = '0px 0px 2.7px rgba(0,0,0,0.72)'; // Уменьшено на 10%

                progressContainer.appendChild(progressBar);
                progressContainer.appendChild(progressText);
                bundleCard.appendChild(progressContainer);

                topSection.appendChild(bundleCard);
            });
        }

        div.appendChild(topSection);

        // Footer note
        const footer = document.createElement('div');
        footer.style.padding = '9px 13.5px'; // Уменьшено на 10%
        footer.style.textAlign = 'center';
        footer.style.fontSize = '9.9px'; // Уменьшено на 10%
        footer.style.color = '#666';
        footer.style.borderTop = '0.9px solid #333'; // Уменьшено на 10%
        footer.textContent = 'Data provided by TrenchRadar • v1.9.4';
        div.appendChild(footer);

        div.style.display = 'block';
        setTimeout(() => div.style.opacity = '1', 10);
        isPopupOpen = true;

        // Добавляем отслеживание изменений URL
        window.addEventListener('hashchange', handleUrlChange);
        window.addEventListener('popstate', handleUrlChange);
    }

    function fetchTrenchBotBundles(tokenAddress, isAutoRefresh = false) {
    
    // Сохраняем состояние автообновления перед запросом
    const wasAutoRefreshActive = isAutoRefreshActive;
    
    // Для автообновления запускаем анимацию кнопки
    if (isAutoRefresh) {
        const autoRefreshBtn = document.getElementById('trench-auto-refresh-btn');
        if (autoRefreshBtn) {
            const svgElement = autoRefreshBtn.querySelector('svg');
            if (svgElement) {
                svgElement.classList.remove('trench-refreshing');
                void svgElement.offsetWidth; // Trigger reflow
                svgElement.classList.add('trench-refreshing');
                
                // Убираем анимацию через 500 мс (после завершения)
                setTimeout(() => {
                    svgElement.classList.remove('trench-refreshing');
                }, 500);
            }
        }
    } else {
        // Для ручного обновления показываем оверлей
        showOverlay();
    }

    // Сохраняем текущий адрес токена для обновления
    currentTokenAddress = tokenAddress;
    
    // Отменяем предыдущие запросы
    activeRequests.forEach(requestId => {
        chrome.runtime.sendMessage({ action: 'abortRequest', requestId });
    });
    activeRequests = [];
    
    chrome.runtime.sendMessage({ 
        action: 'getCookies', 
        domain: 'trench.bot' 
    }, (response) => {
        if (!isPopupOpen) {
            return;
        }
        
        if (!response?.cookies) {
            const error = 'Failed to get cookies for TrenchRadar';
            createOrUpdateInfo({
                error: error + '\nPlease make sure you are logged in on trench.bot'
            });
            if (!isAutoRefresh) hideOverlay();
            return;
        }
        
        const cookieStr = response.cookies.map(c => `${c.name}=${c.value}`).join('; ');
        const requestId = 'trench_' + Date.now();
        
        chrome.runtime.sendMessage({
            action: 'fetchData',
            requestId: requestId,
            url: `https://trench.bot/api/bundle/bundle_full/${tokenAddress}`,
            headers: {
                'accept': 'application/json, text/plain, */*',
                'origin': 'https://trench.bot',
                'referer': `https://trench.bot/bundles/${tokenAddress}`,
                'user-agent': navigator.userAgent,
                'cookie': cookieStr
            }
        }, (resp) => {
            // Удаляем ID запроса из активных
            activeRequests = activeRequests.filter(id => id !== requestId);
            
            // Скрываем оверлей только для ручного обновления
            if (!isAutoRefresh) {
                hideOverlay();
            }
            
            // Проверяем, открыт ли еще попап
            if (!isPopupOpen) {
                return;
            }
            
            // Обработка ошибок сети/сервера
            if (resp?.error) {
                const error = `Network error: ${resp.error}`;
                createOrUpdateInfo({
                    error: error + '\nPlease check your internet connection'
                });
                return;
            }
            
            // Обработка ошибок API
            if (!resp?.data || resp.data?.error) {
                const error = resp.data?.error 
                    ? `API error: ${resp.data.error}` 
                    : 'Invalid response from TrenchRadar';
                
                createOrUpdateInfo({
                    error: "Token not found or not tracked by TrenchRadar\n" +
                          "(Only pump.fun tokens are supported)\n"
                });
                return;
            }
            
            try {
                const data = resp.data;
                
                // Проверка наличия данных о бандлах
                if (!data.bundles || Object.keys(data.bundles).length === 0) {
                    const error = "No bundles found. This token might not be tracked by TrenchRadar or it's too early to check";
                    createOrUpdateInfo(error);
                    return;
                }

                const totalBundles = Object.keys(data.bundles).length;
                const totalSol = Object.values(data.bundles).reduce((sum, b) => sum + b.total_sol, 0);
                const totalHolding = Object.values(data.bundles).reduce((sum, b) => sum + b.holding_percentage, 0);

                const holdingBundles = Object.entries(data.bundles)
                    .map(([id, b]) => {
                        const remainingBundlePercent = b.total_tokens > 0 
                            ? (b.holding_amount / b.total_tokens * 100) 
                            : 0;
                        
                        return {
                            id,
                            ...b,
                            primary_category: b.bundle_analysis.primary_category,
                            remainingBundlePercent: remainingBundlePercent
                        };
                    })
                    .filter(b => b.holding_percentage > 0);

                const topHoldingBundles = holdingBundles
                    .sort((a, b) => b.total_sol - a.total_sol)
                    .slice(0, 5);

                const popupData = {
                    tokenTicker: data.ticker ?? 'TOKEN',
                    overall: {
                        holdingBundles: holdingBundles.length,
                        totalBundles: totalBundles,
                        totalSol: totalSol.toFixed(2),
                        totalHolding: totalHolding.toFixed(4)
                    },
                    topBundles: topHoldingBundles.map(b => ({
                        id: b.id,
                        uniqueWallets: b.unique_wallets,
                        primaryCategory: b.primary_category,
                        tokenPercentage: b.token_percentage.toFixed(4),
                        solSpent: b.total_sol.toFixed(2),
                        holdingPercentage: b.holding_percentage.toFixed(4),
                        remainingBundlePercent: b.remainingBundlePercent
                    }))
                };

                createOrUpdateInfo(popupData);

            } catch (e) {
                const error = `Data processing error: ${e.message}\n${e.stack}`;
                createOrUpdateInfo({
                    error: "An error occurred while processing data\n" +
                           "Please try again or contact support\n\n" +
                           "Error details: " + e.message
                });
            }
        });
        
        // Добавляем ID запроса в активные
        activeRequests.push(requestId);
    });
}

    function getFullTokenAddress(pairAddress, cb) {
    
    const requestId = 'axiom_' + Date.now();
    
    chrome.runtime.sendMessage({
        action: 'fetchData',
        requestId: requestId,
        url: `https://api3.axiom.trade/clipboard-pair-info?address=${pairAddress}`,
        headers: {
            'accept': 'application/json, text/plain, */*',
            'origin': 'https://axiom.trade',
            'referer': 'https://axiom.trade/',
            'user-agent': navigator.userAgent
        }
    }, (resp) => {
        // Удаляем ID запроса из активных
        activeRequests = activeRequests.filter(id => id !== requestId);
        
        // Проверяем, открыт ли еще попап
        if (!isPopupOpen) {
            return;
        }
        
        if (resp?.error) {
            const error = `Axiom API error: ${resp.error}`;
            createOrUpdateInfo({
                error: "Failed to get token address from Axiom\n" +
                       "Please try again later\n\n" +
                       "Error: " + resp.error
            });
            return;
        }
        
        try {
            
            if (!resp.data?.tokenAddress) {
                const error = 'Token address not found in API response';
                createOrUpdateInfo({
                    error: "Token address not found in Axiom response\n" +
                           "This pair might not exist or API is down"
                });
                return;
            }
            
            cb(resp.data.tokenAddress);
        } catch (e) {
            const error = `JSON parsing error: ${e.message}\n${e.stack}`;
            createOrUpdateInfo({
                error: "Failed to parse Axiom API response\n" +
                       "Please try again later\n\n" +
                       "Error: " + e.message
            });
        }
    });
    
    // Добавляем ID запроса в активные
    activeRequests.push(requestId);
}

    function getPairAddressFromURL() {
        const url = window.location.href;
        const match = url.match(/\/meme\/([^/?#]+)/);
        return match ? match[1] : null;
    }
    
    // Новая функция для определения текущего сайта
    function getCurrentSite() {
        if (window.location.hostname.includes('axiom.trade')) {
            return 'axiom';
        } else if (window.location.hostname.includes('nova.trade')) {
            return 'nova';
        }
        return null;
    }

    function init() {
    const site = getCurrentSite();
    let tokenAddress = null;

    if (site === 'axiom') {
        const pairAddress = getPairAddressFromURL();

        if (!pairAddress) {
            const error = 'Pair address not found in URL';
            createOrUpdateInfo({
                error: "Could not detect pair address in URL\n" +
                       "Please make sure you're on a valid Axiom trade page"
            });
            return;
        }

        createOrUpdateInfo({
            loading: true,
            message: "Fetching token address from Axiom..."
        });

        getFullTokenAddress(pairAddress, (fullAddr) => {
            if (!fullAddr) {
                const error = "Token address not found";
                createOrUpdateInfo({
                    error: "Could not get token address\n" +
                           "This pair might not exist or API is down"
                });
                return;
            }

            if (!isPopupOpen) {
                return;
            }

            createOrUpdateInfo({
                loading: true,
                message: "Fetching bundles from TrenchRadar..."
            });
            fetchTrenchBotBundles(fullAddr);
        });
    } 
    else if (site === 'nova') {
        
        // Извлекаем адрес токена из URL
        const url = window.location.href;
        const match = url.match(/nova\.trade\/token\/([^/?#]+)/);
        
        if (!match) {
            const error = 'Token address not found in URL';
            createOrUpdateInfo({
                error: "Could not detect token address in URL\n" +
                       "Please make sure you're on a valid Nova token page"
            });
            return;
        }
        
        tokenAddress = match[1];
        createOrUpdateInfo({
            loading: true,
            message: "Fetching bundles from TrenchRadar..."
        });
        fetchTrenchBotBundles(tokenAddress);
    } else {
        const error = 'Unsupported website';
        createOrUpdateInfo({
            error: "This website is not supported by TrenchRadar\n" +
                   "Currently supported: axiom.trade and nova.trade"
        });
    }
}

    // Новая функция вставки кнопки в контейнер статистики
    function insertButton() {
        const site = getCurrentSite();
        
        // Для axiom.trade - существующая логика
        if (site === 'axiom') {
            // Находим контейнер статистики по более надёжному селектору
            const statsContainer = document.querySelector('div.flex.flex-col.flex-1.gap-\\[16px\\].p-\\[16px\\].pt-\\[4px\\].min-h-\\[0px\\]');
            
            if (!statsContainer) {
                return;
            }

            // Создаем кнопку
            const checkBtn = document.createElement('button');
            checkBtn.textContent = 'Check Bundles';
            checkBtn.id = 'trench-check-btn';
            Object.assign(checkBtn.style, {
                width: '100%',
                padding: '10px 0',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(to right, #6a11cb, #2575fc)',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                margin: '0 0 4px 0',
                textAlign: 'center'
            });

            // Добавляем эффекты при наведении
            checkBtn.addEventListener('mouseenter', () => {
                checkBtn.style.transform = 'translateY(-1px)';
                checkBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });
            
            checkBtn.addEventListener('mouseleave', () => {
                checkBtn.style.transform = 'translateY(0)';
                checkBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            });

            // Обработчик клика
            checkBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const infoDiv = document.getElementById('trench-info-div');
                if (!infoDiv || infoDiv.style.display === 'none') {
                    init();
                } else {
                    closeInfoPopup();
                }
            });

            // Вставляем кнопку после второго ряда статистики
            if (statsContainer.children.length >= 8) {
                // Вставляем после второго элемента (индекс 1)
                statsContainer.insertBefore(checkBtn, statsContainer.children[8]);
            } else {
                // Если структура неожиданная, добавляем в начало
                statsContainer.prepend(checkBtn);
            }
        } 
        // Для nova.trade - новая логика
        else if (site === 'nova') {
            // Находим целевой элемент
            const targetElement = document.querySelector('div.flex.h-\\[42px\\].w-full.items-center.justify-between.py-3.md\\:h-\\[34px\\]');
            
            if (!targetElement) {
                return;
            }

            // Создаем контейнер для кнопки
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'w-full mb-2';
            buttonContainer.style.marginTop = '8px';
            buttonContainer.style.marginBottom = '8px';

            // Создаем кнопку
            const checkBtn = document.createElement('button');
            checkBtn.textContent = 'Check Bundles';
            checkBtn.id = 'trench-check-btn';
            Object.assign(checkBtn.style, {
                width: '100%',
                padding: '10px 0',
                fontSize: '14px',
                cursor: 'pointer',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(to right, #6a11cb, #2575fc)',
                color: 'white',
                fontWeight: 'bold',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
                textAlign: 'center'
            });

            // Эффекты при наведении
            checkBtn.addEventListener('mouseenter', () => {
                checkBtn.style.transform = 'translateY(-1px)';
                checkBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });
            
            checkBtn.addEventListener('mouseleave', () => {
                checkBtn.style.transform = 'translateY(0)';
                checkBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            });

            // Обработчик клика
            checkBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const infoDiv = document.getElementById('trench-info-div');
                if (!infoDiv || infoDiv.style.display === 'none') {
                    init();
                } else {
                    closeInfoPopup();
                }
            });

            // Добавляем кнопку в контейнер
            buttonContainer.appendChild(checkBtn);
            
            // Вставляем контейнер перед целевым элементом
            targetElement.parentNode.insertBefore(buttonContainer, targetElement);
        }
    }

    // Вставляем кнопку при загрузке страницы с улучшенным наблюдателем
    const observer = new MutationObserver((mutations) => {
        // Для nova.trade
        if (getCurrentSite() === 'nova') {
            const targetElement = document.querySelector('div.flex.h-\\[42px\\].w-full.items-center.justify-between.py-3.md\\:h-\\[34px\\]');
            if (targetElement && !document.getElementById('trench-check-btn')) {
                try {
                    insertButton();
                } catch (e) {
                }
            }
        }
        // Для axiom.trade
        else if (getCurrentSite() === 'axiom') {
            const statsContainer = document.querySelector('div.flex.flex-col.flex-1.gap-\\[16px\\].p-\\[16px\\].pt-\\[4px\\].min-h-\\[0px\\]');
            if (statsContainer && !document.getElementById('trench-check-btn')) {
                try {
                    insertButton();
                } catch (e) {
                }
            }
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
    
    // Закрытие попапа при клике в любое место страницы
    document.addEventListener('click', function(event) {
        const infoDiv = document.getElementById('trench-info-div');
        if (infoDiv && infoDiv.style.display !== 'none' && event.target !== document.getElementById('trench-check-btn')) {
            closeInfoPopup();
        }
    });
})();