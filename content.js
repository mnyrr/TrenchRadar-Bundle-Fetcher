// content.js
(function() {
    'use strict';

    // Переменные для отслеживания активных запросов
    let activeRequests = [];
    let isPopupOpen = false;

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
            }, 300);
        }
    }

    // Закрытие попапа при изменении URL
    function handleUrlChange() {
        closeInfoPopup();
    }

    function createOrUpdateInfo(data) {
        let div = document.getElementById('trench-info-div');
        const button = document.getElementById('trench-check-btn');

        if (!div) {
            div = document.createElement('div');
            div.id = 'trench-info-div';
            Object.assign(div.style, {
                position: 'fixed',
                width: '380px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '0',
                backgroundColor: 'rgba(33,33,33,0.98)',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '6px',
                zIndex: '99999',
                cursor: 'default',
                display: 'none',
                fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                border: '2px solid rgba(139, 101, 255, 0.3)',
                outline: '2px solid rgba(255, 255, 255, 0.1)',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            });
            
            // Закрытие попапа при клике на него
            div.addEventListener('click', closeInfoPopup);
            
            document.body.appendChild(div);
        } else {
            div.innerHTML = '';
        }

            // Фиксированное позиционирование в правом верхнем углу
            div.style.position = 'fixed';
            div.style.top = '40px';
            div.style.right = '20px';
            div.style.left = 'auto';
            div.style.bottom = 'auto';

        if (typeof data === 'string') {
            // Стильный индикатор загрузки
            const loadingContainer = document.createElement('div');
            loadingContainer.style.padding = '30px 20px';
            loadingContainer.style.textAlign = 'center';
            
            const spinnerContainer = document.createElement('div');
            spinnerContainer.style.display = 'inline-block';
            spinnerContainer.style.position = 'relative';
            spinnerContainer.style.width = '80px';
            spinnerContainer.style.height = '80px';
            
            const spinner = document.createElement('div');
            spinner.style.position = 'absolute';
            spinner.style.width = '64px';
            spinner.style.height = '64px';
            spinner.style.margin = '8px';
            spinner.style.border = '6px solid rgba(139, 101, 255, 0.3)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTopColor = '#8e2de2';
            spinner.style.animation = 'spin 1s ease-in-out infinite';
            
            const innerSpinner = document.createElement('div');
            innerSpinner.style.position = 'absolute';
            innerSpinner.style.width = '40px';
            innerSpinner.style.height = '40px';
            innerSpinner.style.margin = '20px';
            innerSpinner.style.border = '4px solid rgba(139, 101, 255, 0.3)';
            innerSpinner.style.borderRadius = '50%';
            innerSpinner.style.borderTopColor = '#4a00e0';
            innerSpinner.style.animation = 'spinReverse 1.2s ease-in-out infinite';
            
            const loadingText = document.createElement('div');
            loadingText.textContent = 'Loading...';
            loadingText.style.marginTop = '20px';
            loadingText.style.fontSize = '16px';
            loadingText.style.fontWeight = '600';
            loadingText.style.color = '#bbb';
            loadingText.style.letterSpacing = '1px';
            
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

        // Header (закрепленный)
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '12px 15px';
        header.style.borderBottom = '1px solid #444';
        header.style.background = 'linear-gradient(to right, #1a1a2e, #16213e)';
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '1';

        const title = document.createElement('h2');
        title.innerHTML = `<span style="color: #eee; font-weight: 600;">TrenchRadar:</span> <span style="color: #4fc3f7; font-weight: 700;">$${data.tokenTicker}</span>`;
        title.style.margin = '0';
        title.style.fontSize = '18px';
        title.style.fontWeight = '600';

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '28px';
        closeBtn.style.color = '#ddd';
        closeBtn.style.width = '32px';
        closeBtn.style.height = '32px';
        closeBtn.style.display = 'flex';
        closeBtn.style.alignItems = 'center';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.transition = 'all 0.2s';
        closeBtn.style.borderRadius = '4px';
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.color = '#fff';
            closeBtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.color = '#ddd';
            closeBtn.style.backgroundColor = 'transparent';
        });
        closeBtn.addEventListener('click', closeInfoPopup);

        header.appendChild(title);
        header.appendChild(closeBtn);
        div.appendChild(header);

        // Overall Stats
        const overallSection = document.createElement('section');
        overallSection.style.padding = '10px 15px';
        overallSection.style.borderBottom = '1px solid #444';

        const overallTitle = document.createElement('h3');
        overallTitle.innerHTML = '📊 <span style="border-bottom: 1px dashed #666; padding-bottom: 3px; font-weight: 600;">Overall Statistics</span>';
        overallTitle.style.marginTop = '3px';
        overallTitle.style.marginBottom = '8px';
        overallTitle.style.fontSize = '16px';
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
            statRow.style.marginBottom = '3px';
            statRow.style.alignItems = 'center';
            statRow.style.padding = '5px 10px';

            const labelDiv = document.createElement('div');
            labelDiv.style.display = 'flex';
            labelDiv.style.alignItems = 'center';
            labelDiv.style.gap = '8px';
            labelDiv.style.fontWeight = '500';

            const iconSpan = document.createElement('span');
            iconSpan.textContent = stat.icon;
            iconSpan.style.fontSize = '18px';

            const textSpan = document.createElement('span');
            textSpan.textContent = stat.label;
            textSpan.style.fontWeight = '500';

            labelDiv.appendChild(iconSpan);
            labelDiv.appendChild(textSpan);

            const valueDiv = document.createElement('div');
            valueDiv.textContent = stat.value;
            valueDiv.style.fontWeight = stat.fontWeight || '600';
            valueDiv.style.color = stat.color;
            valueDiv.style.fontSize = '14px';

            statRow.appendChild(labelDiv);
            statRow.appendChild(valueDiv);
            overallSection.appendChild(statRow);
        });

        div.appendChild(overallSection);

        // Top Bundles
const topSection = document.createElement('section');
topSection.style.padding = '15px';

const topTitle = document.createElement('h3');
topTitle.innerHTML = '🏆 <span style="border-bottom: 1px dashed #666; padding-bottom: 3px; font-weight: 600;">Top 5 Holding Bundles</span>';
topTitle.style.marginTop = '0';
topTitle.style.marginBottom = '15px';
topTitle.style.fontSize = '16px';
topTitle.style.color = '#ffb74d';
topTitle.style.fontWeight = '600';

topSection.appendChild(topTitle);

if (data.topBundles.length === 0) {
    const empty = document.createElement('div');
    empty.style.textAlign = 'center';
    empty.style.padding = '20px 0';
    empty.style.color = '#888';
    empty.textContent = 'No bundles holding tokens';
    topSection.appendChild(empty);
} else {
    data.topBundles.forEach(bundle => {
        const bundleCard = document.createElement('div');
        bundleCard.style.background = 'rgba(50,50,70,0.4)';
        bundleCard.style.borderRadius = '8px';
        bundleCard.style.padding = '8px 15px';
        bundleCard.style.marginBottom = '8px';
        bundleCard.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        bundleCard.style.borderLeft = '3px solid #4a148c';

        const bundleHeader = document.createElement('div');
        bundleHeader.style.display = 'flex';
        bundleHeader.style.justifyContent = 'space-between';
        bundleHeader.style.alignItems = 'center';
        bundleHeader.style.marginBottom = '8px';

        const bundleTitle = document.createElement('div');
        bundleTitle.style.display = 'flex';
        bundleTitle.style.alignItems = 'center';
        bundleTitle.style.gap = '8px';

        const categoryEmoji = {
            sniper: '🎯',
            new_wallet: '🌱',
            regular: '✅'
        }[bundle.primaryCategory] || '🔹';

        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = categoryEmoji;
        emojiSpan.style.fontSize = '20px';

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
        categorySpan.style.padding = '3px 20px';
        categorySpan.style.borderRadius = '10px';
        categorySpan.style.fontSize = '14px';
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
            statRow.style.marginBottom = '3px';
            statRow.style.fontSize = '14px';

            const labelDiv = document.createElement('div');
            labelDiv.style.display = 'flex';
            labelDiv.style.alignItems = 'center';
            labelDiv.style.gap = '6px';
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
                progressContainer.style.height = '24px';
                progressContainer.style.backgroundColor = 'rgba(255,255,255,0.1)';
                progressContainer.style.borderRadius = '4px';
                progressContainer.style.marginTop = '10px';
                progressContainer.style.overflow = 'hidden';

                const progressBar = document.createElement('div');
                progressBar.style.width = Math.min(100, bundle.remainingBundlePercent) + '%';
                progressBar.style.height = '100%';
                progressBar.style.background = 'linear-gradient(to right, #4a00e0, #8e2de2)';
                progressBar.style.borderRadius = '4px';

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
                progressText.style.fontSize = '12px';
                progressText.style.fontWeight = '600';
                progressText.style.color = '#fff';
                progressText.style.textShadow = '0px 0px 3px rgba(0,0,0,0.8)';

                progressContainer.appendChild(progressBar);
                progressContainer.appendChild(progressText);
                bundleCard.appendChild(progressContainer);

                topSection.appendChild(bundleCard);
            });
        }

        div.appendChild(topSection);

        // Footer note
        const footer = document.createElement('div');
        footer.style.padding = '10px 15px';
        footer.style.textAlign = 'center';
        footer.style.fontSize = '11px';
        footer.style.color = '#666';
        footer.style.borderTop = '1px solid #333';
        footer.textContent = 'Data provided by TrenchRadar • v1.9.4';
        div.appendChild(footer);

        div.style.display = 'block';
        setTimeout(() => div.style.opacity = '1', 10);
        isPopupOpen = true;

        // Добавляем отслеживание изменений URL
        window.addEventListener('hashchange', handleUrlChange);
        window.addEventListener('popstate', handleUrlChange);
    }

    function fetchTrenchBotBundles(tokenAddress) {
        chrome.runtime.sendMessage({ 
            action: 'getCookies', 
            domain: 'trench.bot' 
        }, (response) => {
            if (!isPopupOpen) return;
            
            if (!response.cookies) {
                createOrUpdateInfo('Failed to get cookies');
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
                
                // Проверяем, открыт ли еще попап
                if (!isPopupOpen) return;
                
                if (resp.error) {
                    createOrUpdateInfo(`Error: ${resp.error}`);
                    return;
                }
                
                try {
                    const data = resp.data;
                    if (!data.bundles || Object.keys(data.bundles).length === 0) {
                        createOrUpdateInfo('No bundles found');
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
                    createOrUpdateInfo(`JSON parsing error: ${e.message}`);
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
            if (!isPopupOpen) return;
            
            if (resp.error) {
                createOrUpdateInfo(`Error: ${resp.error}`);
                return;
            }
            
            try {
                const data = resp.data;
                if (!data.tokenAddress) {
                    createOrUpdateInfo('Token address not found in API response');
                    return;
                }
                cb(data.tokenAddress);
            } catch (e) {
                createOrUpdateInfo(`JSON parsing error: ${e.message}`);
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

    function init() {
    const pairAddress = getPairAddressFromURL();

    if (!pairAddress) {
        // Показываем только сообщение об ошибке, индикатор загрузки не нужен
        createOrUpdateInfo('Pair not found in URL', true); // true — например, может означать статус ошибки
        return;
    }

    // Показываем индикатор загрузки
    createOrUpdateInfo("Fetching token address...");

    getFullTokenAddress(pairAddress, (fullAddr) => {
        if (!fullAddr) {
            createOrUpdateInfo("Token address not found");
            return;
        }

        if (!isPopupOpen) return;

        createOrUpdateInfo("Fetching bundles...");

        fetchTrenchBotBundles(fullAddr);
    });
}


    // Новая функция вставки кнопки в контейнер статистики
    function insertButton() {
    // Находим контейнер статистики по более надёжному селектору
    const statsContainer = document.querySelector('div.flex.flex-col.flex-1.gap-\\[16px\\].p-\\[16px\\].pt-\\[4px\\].min-h-\\[0px\\]');
    
    if (!statsContainer) {
        console.log('Stats container not found');
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

// Вставляем кнопку при загрузке страницы с улучшенным наблюдателем
const observer = new MutationObserver((mutations) => {
    const statsContainer = document.querySelector('div.flex.flex-col.flex-1.gap-\\[16px\\].p-\\[16px\\].pt-\\[4px\\].min-h-\\[0px\\]');
    if (statsContainer) {
        // Проверяем, не добавлена ли уже кнопка
        if (!document.getElementById('trench-check-btn')) {
            try {
                insertButton();
            } catch (e) {
                console.error('Error inserting button:', e);
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
