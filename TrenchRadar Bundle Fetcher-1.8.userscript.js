// ==UserScript==
// @name         TrenchRadar Bundle Fetcher
// @namespace    http://tampermonkey.net/
// @version      1.8
// @match        https://axiom.trade/*
// @grant        GM_xmlhttpRequest
// @grant        GM_cookie
// @connect      api3.axiom.trade
// @connect      trench.bot
// ==/UserScript==

(function() {
    'use strict';

    // Функция для закрытия попапа и оверлея
    function closeInfoPopup() {
        const infoDiv = document.getElementById('trench-info-div');
        const overlay = document.getElementById('trench-overlay');

        if (infoDiv && infoDiv.style.display !== 'none') {
            infoDiv.style.opacity = '0';
            setTimeout(() => { infoDiv.style.display = 'none'; }, 300);
        }

        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => { overlay.style.display = 'none'; }, 300);
        }
    }

    // Функция для создания оверлея
    function createOverlay() {
        let overlay = document.getElementById('trench-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'trench-overlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.05)',
                backdropFilter: 'blur(2px)',
                zIndex: '99990',
                display: 'none',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            });
            document.body.appendChild(overlay);

            // Закрытие при клике на оверлей
            overlay.addEventListener('click', () => {
                closeInfoPopup();
            });
        }
        return overlay;
    }

    function createOrUpdateInfo(data) {
        let div = document.getElementById('trench-info-div');
        const overlay = createOverlay();
        const button = document.getElementById('trench-check-btn');

        if (!div) {
            div = document.createElement('div');
            div.id = 'trench-info-div';
            Object.assign(div.style, {
                position: 'fixed',
                width: '400px',
                maxHeight: '75vh',
                overflowY: 'auto',
                padding: '0',
                backgroundColor: 'rgba(33,33,33,0.98)',
                color: 'white',
                fontSize: '13px',
                borderRadius: '6px',
                zIndex: '99999',
                cursor: 'default',
                display: 'none',
                fontFamily: '"Segoe UI", Roboto, sans-serif',
                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                border: '2px solid rgba(100, 180, 246, 0.5)',
                outline: '3px solid rgba(255, 255, 255, 0.1)',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            });
            document.body.appendChild(div);
        } else {
            div.innerHTML = '';
        }

        // Позиционируем попап под кнопкой
        if (button) {
            const rect = button.getBoundingClientRect();
            div.style.top = (rect.bottom + window.scrollY + 10) + 'px';
            div.style.left = (rect.left + window.scrollX -70) + 'px';
        } else {
            // Запасное позиционирование
            div.style.top = '60px';
            div.style.right = '15px';
        }

        // Предотвращаем закрытие при клике внутри попапа
        div.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        if (typeof data === 'string') {
            const errorDiv = document.createElement('div');
            errorDiv.style.padding = '15px';
            errorDiv.textContent = data;
            div.appendChild(errorDiv);
            div.style.display = 'block';
            overlay.style.display = 'block';
            setTimeout(() => {
                div.style.opacity = '1';
                overlay.style.opacity = '1';
            }, 10);
            return;
        }

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.padding = '15px 15px 12px';
        header.style.borderBottom = '1px solid #444';
        header.style.background = 'linear-gradient(to right, #1a1a2e, #16213e)';

        const title = document.createElement('h2');
        title.innerHTML = `<span style="color: #eee;">TrenchRadar:</span> <span style="color: #4fc3f7;">$${data.tokenTicker}</span>`;
        title.style.margin = '0';
        title.style.fontSize = '16px';
        title.style.fontWeight = '600';

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.color = '#aaa';
        closeBtn.addEventListener('click', () => {
            closeInfoPopup();
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        div.appendChild(header);

        // Overall Stats
        const overallSection = document.createElement('section');
        overallSection.style.padding = '15px';
        overallSection.style.borderBottom = '1px solid #444';

        const overallTitle = document.createElement('h3');
        overallTitle.innerHTML = '📊 <span style="border-bottom: 1px dashed #666; padding-bottom: 3px;">Overall Statistics</span>';
        overallTitle.style.marginTop = '0';
        overallTitle.style.marginBottom = '15px';
        overallTitle.style.fontSize = '15px';
        overallTitle.style.color = '#ffb74d';

        overallSection.appendChild(overallTitle);

        const stats = [
            { icon: '💼', label: 'Holding Bundles', value: data.overall.holdingBundles, color: '#e57373' },
            { icon: '📦', label: 'Total Bundles', value: data.overall.totalBundles, color: '#ba68c8' },
            { icon: '💰', label: 'Total SOL Spent', value: data.overall.totalSol + ' SOL', color: '#4db6ac' },
            { icon: '📈', label: 'Current Held Percentage', value: data.overall.totalHolding + '%', color: '#64b5f6' }
        ];

        stats.forEach(stat => {
            const statRow = document.createElement('div');
            statRow.style.display = 'flex';
            statRow.style.justifyContent = 'space-between';
            statRow.style.marginBottom = '10px';
            statRow.style.alignItems = 'center';

            const labelDiv = document.createElement('div');
            labelDiv.style.display = 'flex';
            labelDiv.style.alignItems = 'center';
            labelDiv.style.gap = '8px';

            const iconSpan = document.createElement('span');
            iconSpan.textContent = stat.icon;
            iconSpan.style.fontSize = '18px';

            const textSpan = document.createElement('span');
            textSpan.textContent = stat.label;

            labelDiv.appendChild(iconSpan);
            labelDiv.appendChild(textSpan);

            const valueDiv = document.createElement('div');
            valueDiv.textContent = stat.value;
            valueDiv.style.fontWeight = '600';
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
        topTitle.innerHTML = '🏆 <span style="border-bottom: 1px dashed #666; padding-bottom: 3px;">Top 5 Holding Bundles</span>';
        topTitle.style.marginTop = '0';
        topTitle.style.marginBottom = '15px';
        topTitle.style.fontSize = '15px';
        topTitle.style.color = '#ffb74d';

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
                bundleCard.style.padding = '12px';
                bundleCard.style.marginBottom = '12px';
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
                categorySpan.style.padding = '3px 8px';
                categorySpan.style.borderRadius = '10px';
                categorySpan.style.fontSize = '12px';
                bundleHeader.appendChild(categorySpan);

                bundleCard.appendChild(bundleHeader);

                const bundleStats = [
                    { icon: '👥', label: 'Unique Wallets', value: bundle.uniqueWallets },
                    { icon: '📊', label: '% of Supply', value: bundle.tokenPercentage + '%' },
                    { icon: '💸', label: 'SOL Spent', value: bundle.solSpent + ' SOL' },
                    { icon: '📌', label: 'Holding', value: bundle.holdingPercentage + '%' }
                ];

                bundleStats.forEach(stat => {
                    const statRow = document.createElement('div');
                    statRow.style.display = 'flex';
                    statRow.style.justifyContent = 'space-between';
                    statRow.style.marginBottom = '6px';
                    statRow.style.fontSize = '13px';

                    const labelDiv = document.createElement('div');
                    labelDiv.style.display = 'flex';
                    labelDiv.style.alignItems = 'center';
                    labelDiv.style.gap = '6px';
                    labelDiv.style.color = '#aaa';

                    const iconSpan = document.createElement('span');
                    iconSpan.textContent = stat.icon;

                    const textSpan = document.createElement('span');
                    textSpan.textContent = stat.label;

                    labelDiv.appendChild(iconSpan);
                    labelDiv.appendChild(textSpan);

                    const valueDiv = document.createElement('div');
                    valueDiv.textContent = stat.value;
                    valueDiv.style.fontWeight = '500';
                    valueDiv.style.color = '#fff';

                    statRow.appendChild(labelDiv);
                    statRow.appendChild(valueDiv);
                    bundleCard.appendChild(statRow);
                });

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
        footer.textContent = 'Data provided by TrenchRadar • v1.8';
        div.appendChild(footer);

        div.style.display = 'block';
        overlay.style.display = 'block';
        setTimeout(() => {
            div.style.opacity = '1';
            overlay.style.opacity = '1';
        }, 10);
    }

    function fetchTrenchBotBundles(tokenAddress) {
        GM_cookie.list({ domain: 'trench.bot' }, function(cookies) {
            const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');

            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://trench.bot/api/bundle/bundle_full/${tokenAddress}`,
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'origin': 'https://trench.bot',
                    'referer': `https://trench.bot/bundles/${tokenAddress}`,
                    'user-agent': navigator.userAgent,
                    'cookie': cookieStr
                },
                onload: (resp) => {
                    console.log(`🟢 TrenchBot API статус: ${resp.status}`);
                    if (resp.status !== 200) {
                        createOrUpdateInfo(`TrenchBot API error: status ${resp.status}`);
                        return;
                    }
                    try {
                        const data = JSON.parse(resp.responseText);
                        if (!data.bundles || Object.keys(data.bundles).length === 0) {
                            createOrUpdateInfo('No bundles found');
                            return;
                        }

                        const totalBundles = Object.keys(data.bundles).length;
                        const totalSol = Object.values(data.bundles).reduce((sum, b) => sum + b.total_sol, 0);
                        const totalHolding = Object.values(data.bundles).reduce((sum, b) => sum + b.holding_percentage, 0);

                        const holdingBundles = Object.entries(data.bundles)
                            .map(([id, b]) => ({
                                id,
                                ...b,
                                primary_category: b.bundle_analysis.primary_category
                            }))
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
                                holdingPercentage: b.holding_percentage.toFixed(4)
                            }))
                        };

                        createOrUpdateInfo(popupData);

                    } catch (e) {
                        createOrUpdateInfo(`JSON parsing error: ${e.message}`);
                    }
                },
                onerror: (resp) => {
                    console.error('🔴 Network error:', resp);
                    createOrUpdateInfo('Network request failed');
                }
            });
        });
    }

    function formatNumber(num) {
        if (num === undefined || num === null) return 'N/A';
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + ' million';
        if (num >= 1_000) return (num / 1_000).toFixed(2) + ' thousand';
        return num.toString();
    }

    function formatPercent(num) {
        if (num === undefined || num === null) return 'N/A';
        return Number(num).toFixed(4) + '%';
    }

    function getFullTokenAddress(pairAddress, cb) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api3.axiom.trade/clipboard-pair-info?address=${pairAddress}`,
            headers: {
                'accept': 'application/json, text/plain, */*',
                'origin': 'https://axiom.trade',
                'referer': 'https://axiom.trade/',
                'user-agent': navigator.userAgent
            },
            onload: (resp) => {
                console.log(`🟢 Axiom API status: ${resp.status}`);
                try {
                    const data = JSON.parse(resp.responseText);
                    if (!data.tokenAddress) {
                        createOrUpdateInfo('Token address not found in API response');
                        return;
                    }
                    cb(data.tokenAddress);
                } catch (e) {
                    createOrUpdateInfo(`JSON parsing error: ${e.message}`);
                }
            },
            onerror: (resp) => {
                console.error('🔴 Network error:', resp);
                createOrUpdateInfo('Network request failed');
            }
        });
    }

    function getPairAddressFromURL() {
        const url = window.location.href;
        const match = url.match(/\/meme\/([^/?#]+)/);
        return match ? match[1] : null;
    }

    function init() {
        const pairAddress = getPairAddressFromURL();
        if (!pairAddress) {
            createOrUpdateInfo('Pair not found in URL');
            return;
        }
        createOrUpdateInfo(`Found pair: ${pairAddress}\nFetching token address...`);
        getFullTokenAddress(pairAddress, (fullAddr) => {
            if (!fullAddr) return;
            createOrUpdateInfo(`Found token address: ${fullAddr}\nFetching bundles...`);
            fetchTrenchBotBundles(fullAddr);
        });
    }

    // Вставка кнопки в навигационную панель
    function insertButton() {
        // Найдем навигационный контейнер по точному совпадению класса
        const navElement = document.querySelector('.border-b.border-primaryStroke.overflow-hidden.flex.flex-row.w-full.h-\\[52px\\].sm\\:h-\\[64px\\].min-h-\\[48px\\].sm\\:min-h-\\[64px\\].px-\\[16px\\].sm\\:px-\\[16px\\].lg\\:px-\\[24px\\].gap-\\[16px\\].sm\\:gap-\\[16px\\].lg\\:gap-\\[24px\\].justify-between.sm\\:justify-start.items-center');

        if (!navElement) {
            console.error('Nav element not found');
            return;
        }

        // Создаем кнопку
        const checkBtn = document.createElement('button');
        checkBtn.textContent = 'Check Bundles';
        checkBtn.id = 'trench-check-btn'; // Добавляем ID для позиционирования
        Object.assign(checkBtn.style, {
            padding: '6px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            borderRadius: '100px',
            border: 'none',
            background: 'linear-gradient(to right, #6a11cb, #2575fc)',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
            height: '32px',
            flexShrink: '0',
            marginLeft: '8px'
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

        // Найдем контейнер с кнопками справа
        const rightSection = navElement.querySelector('.hidden.sm\\:flex.items-center.gap-\\[8px\\].lg\\:gap-\\[16px\\]');

        if (rightSection) {
            // Вставляем перед первым элементом в правой секции
            rightSection.insertBefore(checkBtn, rightSection.firstChild);
        } else {
            // Fallback: вставляем в конец навигационного контейнера
            navElement.appendChild(checkBtn);
        }
    }

    // Вставляем кнопку при загрузке страницы
    const observer = new MutationObserver((mutations) => {
        const navElement = document.querySelector('.border-b.border-primaryStroke');
        if (navElement) {
            observer.disconnect();
            setTimeout(insertButton, 500); // Дадим время на полную инициализацию интерфейса
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
})();