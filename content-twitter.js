// content-twitter.js
(function() {
    'use strict';

    const linkContainers = new Map();
    const ELEMENT_SELECTOR = 'div[class*="flex"][class*="flex-col"][class*="w-full"][class*="cursor-pointer"]';
    const visibleElements = new Set();
    const CACHE_DURATION = 30000;
    let intersectionObserver;
    let mainObserver;
    let dynamicUpdateRAF;
    let isEnabled = true;

    let twitterSettings = {
        twitterEnabled: true,
        fontSize: 11,
        opacity: 75,
        mainColor: '#4FC1FF',
        accentColor: '#FFD702'
    };

    chrome.storage.local.get('twitterSettings', (data) => {
        if (data.twitterSettings) {
            twitterSettings = data.twitterSettings;
            isEnabled = twitterSettings.twitterEnabled !== false;
            applyVisualSettings();
            if (isEnabled) init();
        } else {
            isEnabled = true;
            init();
        }
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'updateTwitterSettings') {
            twitterSettings = request.settings;
            applyVisualSettings();
            const nowEnabled = twitterSettings.twitterEnabled !== false;
            if (nowEnabled && !isEnabled) {
                isEnabled = true;
                init();
            } else if (!nowEnabled && isEnabled) {
                isEnabled = false;
                cleanup();
            }
        }
    });

    function applyVisualSettings() {
        for (const container of linkContainers.values()) {
            updateContainerStyles(container);
        }
    }

    function updateContainerStyles(container) {
        container.style.fontSize = `${twitterSettings.fontSize}px`;
        container.style.opacity = `${twitterSettings.opacity / 100}`;
        const mainElements = container.querySelectorAll('.main');
        mainElements.forEach(el => {
            el.style.color = twitterSettings.mainColor;
        });
        const accentElements = container.querySelectorAll('.accent');
        accentElements.forEach(el => {
            el.style.color = twitterSettings.accentColor;
        });
        const nameElements = container.querySelectorAll('.name, .separator');
        nameElements.forEach(el => {
            el.style.color = 'white';
        });
        const tempMessages = container.querySelectorAll('.temp-message');
        tempMessages.forEach(el => {
            el.style.fontSize = 'inherit';
            el.style.opacity = 'inherit';
        });
    }

    function init() {
        if (intersectionObserver) {
            return;
        }
        intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                if (entry.isIntersecting) {
                    visibleElements.add(element);
                } else {
                    visibleElements.delete(element);
                }
            });
        }, { threshold: 0.1 });

        setupContainerObserver();
        startDynamicUpdates();
    }

    function cleanup() {
        if (intersectionObserver) {
            intersectionObserver.disconnect();
            intersectionObserver = null;
        }
        if (mainObserver) {
            mainObserver.disconnect();
            mainObserver = null;
        }
        if (dynamicUpdateRAF) {
            cancelAnimationFrame(dynamicUpdateRAF);
            dynamicUpdateRAF = null;
        }
        visibleElements.clear();
        for (const container of linkContainers.values()) {
            container.remove();
        }
        linkContainers.clear();
        document.querySelectorAll('[data-twitter-processed]').forEach(el => {
            delete el.dataset.twitterProcessed;
        });
    }

    function setupContainerObserver() {
        mainObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const elements = node.querySelectorAll(ELEMENT_SELECTOR);
                            for (const element of elements) {
                                setTimeout(() => processElement(element), 2000); // Увеличена задержка
                            }
                        }
                    }
                }
            }
        });
        mainObserver.observe(document.body, { childList: true, subtree: true });

        // Повторный поиск элементов через интервал
        const retryFindElements = () => {
            const existingElements = document.querySelectorAll(ELEMENT_SELECTOR);
            for (const element of existingElements) {
                processElement(element);
            }
            if (existingElements.length === 0) {
                setTimeout(retryFindElements, 2000);
            }
        };
        retryFindElements();
    }

    function processElement(element) {
        if (!isEnabled) {
            return;
        }
        if (element.dataset.twitterProcessed === 'completed') {
            return;
        }
        if (!element.dataset.retryCount) element.dataset.retryCount = '0';

        const twitterLinks = Array.from(element.querySelectorAll('a[href*="twitter.com/"], a[href*="x.com/"]'));
        if (twitterLinks.length === 0 && parseInt(element.dataset.retryCount) < 5) { // Увеличено до 5 попыток
            element.dataset.retryCount = parseInt(element.dataset.retryCount) + 1;
            setTimeout(() => processElement(element), 2000);
            return;
        }

        if (twitterLinks.length === 0) {
            setupElementObserver(element);
            return;
        }

        let linkToProcess = null;
        let urlType = null;
        for (const link of twitterLinks) {
            const type = checkUrlType(link.href);
            if (type === 'profile') {
                linkToProcess = link;
                urlType = 'profile';
                break;
            } else if (type === 'community') {
                linkToProcess = link;
                urlType = 'community';
                break;
            }
        }

        if (linkToProcess) {
            processLink(linkToProcess, urlType);
            element.dataset.twitterProcessed = 'completed';
            intersectionObserver.observe(element);
        } else {
            setupElementObserver(element);
        }
    }

    function setupElementObserver(element) {
        const observer = new MutationObserver((mutations, obs) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    const links = Array.from(element.querySelectorAll('a[href*="twitter.com/"], a[href*="x.com/"]'));
                    if (links.length > 0) {
                        obs.disconnect();
                        processElement(element);
                        break;
                    }
                }
            }
        });
        observer.observe(element, { childList: true, subtree: true });
    }

    function startDynamicUpdates() {
        let lastUpdate = 0;
        const updateInterval = 7000;
        const maxUpdatesPerCycle = 5;

        function updateVisibleElements() {
            const now = Date.now();
            if (now - lastUpdate < updateInterval) {
                dynamicUpdateRAF = requestAnimationFrame(updateVisibleElements);
                return;
            }

            lastUpdate = now;
            const elementsToUpdate = Array.from(visibleElements).slice(0, maxUpdatesPerCycle);
            const allElements = document.querySelectorAll(`${ELEMENT_SELECTOR}[data-twitter-processed="completed"]`);
            const elementsToCheck = [...elementsToUpdate, ...Array.from(allElements).filter(el => !visibleElements.has(el))];

            elementsToCheck.forEach(async (element) => {
                const link = element.querySelector('a[href*="twitter.com/"], a[href*="x.com/"]');
                if (!link || link.dataset.twitterProcessed !== 'true') {
                    return;
                }

                const urlType = checkUrlType(link.href);
                const identifier = extractUsername(link.href, urlType);
                if (!identifier) {
                    return;
                }

                const containerElement = linkContainers.get(link);
                if (!containerElement) {
                    return;
                }

                if (urlType === 'community') {
                    const memberCount = await fetchCommunityMemberCount(identifier);
                    if (memberCount !== null) {
                        requestAnimationFrame(() => {
                            containerElement.innerHTML = `
                                <span class="main">XCommunity</span>
                                <span class="accent">${abbreviateNumber(memberCount)}</span>
                            `;
                            updateContainerStyles(containerElement);
                        });
                    }
                } else {
                    chrome.storage.local.get(`profile_${identifier}`, (cached) => {
                        if (cached && cached[`profile_${identifier}`] && Date.now() - cached[`profile_${identifier}`].timestamp < CACHE_DURATION) {
                            const user = cached[`profile_${identifier}`].user;
                            requestAnimationFrame(() => {
                                containerElement.innerHTML = `
                                    <span class="main">@${user.screen_name}</span>
                                    <span class="separator">|</span>
                                    <span class="name">${user.name}</span>
                                    <span class="accent">${abbreviateNumber(user.followers)}</span>
                                `;
                                updateContainerStyles(containerElement);
                            });
                            return;
                        }

                        chrome.runtime.sendMessage({
                            action: 'twitterFetch',
                            url: `https://api.fxtwitter.com/${identifier}`,
                            headers: { 'Accept': 'application/json' }
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('Extension context invalidated:', chrome.runtime.lastError);
                                return;
                            }
                            if (response?.data?.user) {
                                const user = response.data.user;
                                chrome.storage.local.set({
                                    [`profile_${identifier}`]: { 
                                        user, 
                                        timestamp: Date.now() 
                                    }
                                });
                                requestAnimationFrame(() => {
                                    containerElement.innerHTML = `
                                        <span class="main">@${user.screen_name}</span>
                                        <span class="separator">|</span>
                                        <span class="name">${user.name}</span>
                                        <span class="accent">${abbreviateNumber(user.followers)}</span>
                                    `;
                                    updateContainerStyles(containerElement);
                                });
                            } else {
                            }
                        });
                    });
                }
            });

            dynamicUpdateRAF = requestAnimationFrame(updateVisibleElements);
        }

        dynamicUpdateRAF = requestAnimationFrame(updateVisibleElements);
    }

    async function processLink(link, urlType) {
        if (!isEnabled || link.dataset.twitterProcessed) {
            return;
        }
        link.dataset.twitterProcessed = 'true';

        const containerElement = getInfoContainer(link);
        const identifier = extractUsername(link.href, urlType);

        if (!identifier) {
            containerElement.innerHTML = `<span class="temp-message" style="color:#F15461">Invalid URL</span>`;
            updateContainerStyles(containerElement);
            return;
        }

        containerElement.innerHTML = `<span class="temp-message" style="color:#4CAF50">Loading...</span>`;
        updateContainerStyles(containerElement);

        if (urlType === 'community') {
            try {
                const memberCount = await fetchCommunityMemberCount(identifier);
                if (memberCount !== null && memberCount !== undefined) {
                    containerElement.innerHTML = `
                        <span class="main">XCommunity</span>
                        <span class="accent">${abbreviateNumber(memberCount)}</span>
                    `;
                    updateContainerStyles(containerElement);
                } else {
                    containerElement.innerHTML = `<span class="temp-message" style="color:#F15461">No data</span>`;
                    updateContainerStyles(containerElement);
                }
            } catch (e) {
                console.error('Error processing community:', e);
                containerElement.innerHTML = `<span class="temp-message" style="color:#F15461">Error</span>`;
                updateContainerStyles(containerElement);
            }
            return;
        }

        chrome.runtime.sendMessage({
            action: 'twitterFetch',
            url: `https://api.fxtwitter.com/${identifier}`,
            headers: { 'Accept': 'application/json' }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Extension context invalidated:', chrome.runtime.lastError);
                containerElement.innerHTML = `<span class="temp-message" style="color:#F15461">Connection error</span>`;
                updateContainerStyles(containerElement);
                return;
            }
            if (response?.data?.user) {
                const user = response.data.user;
                chrome.storage.local.set({
                    [`profile_${identifier}`]: { 
                        user, 
                        timestamp: Date.now() 
                    }
                });
                containerElement.innerHTML = `
                    <span class="main">@${user.screen_name}</span>
                    <span class="separator">|</span>
                    <span class="name">${user.name}</span>
                    <span class="accent">${abbreviateNumber(user.followers)}</span>
                `;
                updateContainerStyles(containerElement);
            } else {
                containerElement.innerHTML = `<span class="temp-message" style="color:#F15461">Failed</span>`;
                updateContainerStyles(containerElement);
            }
        });
    }

    async function fetchCommunityMemberCount(communityId) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve(null);
            }, 16000);

            chrome.storage.local.get(`community_${communityId}`, (cached) => {
                const cachedValue = cached[`community_${communityId}`];
                if (cachedValue && cachedValue.value && Date.now() - cachedValue.timestamp < CACHE_DURATION) {
                    clearTimeout(timeout);
                    resolve(cachedValue.value);
                    return;
                }

                chrome.runtime.sendMessage({
                    action: 'axiomCommunityFetch',
                    url: `https://api6.axiom.trade/twitter-community-info?communityId=${communityId}`,
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': navigator.userAgent,
                        'Origin': 'https://axiom.trade',
                        'Referer': 'https://axiom.trade/',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    timeout: 5000
                }, (response) => {
                    clearTimeout(timeout);
                    if (chrome.runtime.lastError) {
                        console.error('Extension context invalidated:', chrome.runtime.lastError);
                        resolve(null);
                        return;
                    }
                    if (!response || response.error) {
                        console.error('Community fetch error:', response?.error);
                        resolve(null);
                        return;
                    }
                    try {
                        const data = response?.data;
                        if (!data) {
                            resolve(null);
                            return;
                        }
                        const memberCount = data?.memberCount ??
                            data?.community?.member_count ??
                            data?.member_count ??
                            data?.members ??
                            (typeof data === 'number' ? data : null);
                        if (memberCount !== null && memberCount !== undefined) {
                            chrome.storage.local.set({
                                [`community_${communityId}`]: {
                                    value: memberCount,
                                    timestamp: Date.now()
                                }
                            });
                            resolve(memberCount);
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        console.error('Error parsing community response:', e);
                        resolve(null);
                    }
                });
            });
        });
    }

    function getInfoContainer(link) {
        if (linkContainers.has(link)) {
            return linkContainers.get(link);
        }
        const container = document.createElement('div');
        container.className = 'twitter-info';
        container.style.cssText = `
            position: absolute;
            top: 45%;
            left: -1%;
            z-index: 1000;
            padding: 2px 6px;
            font-weight: 600;
            transition: opacity 0.3s;
            pointer-events: none;
            display: flex;
            gap: 4px;
            align-items: center;
            font-size: ${twitterSettings.fontSize}px;
            opacity: ${twitterSettings.opacity / 100};
        `;
        const postContent = findPostContentContainer(link);
        if (postContent) {
            if (window.getComputedStyle(postContent).position !== 'relative') {
                postContent.style.position = 'relative';
            }
            postContent.appendChild(container);
        } else {
            document.body.appendChild(container);
            const linkRect = link.getBoundingClientRect();
            container.style.top = `${linkRect.bottom + window.scrollY}px`;
            container.style.left = `${linkRect.left + window.scrollX}px`;
        }
        linkContainers.set(link, container);
        updateContainerStyles(container);
        return container;
    }

    function checkUrlType(url) {
        if (url.includes('/i/communities/')) return 'community';
        if (url.includes('/search') || url.includes('/intent/') || url.includes('/list/')) return 'other';
        return 'profile';
    }

    function extractUsername(url, urlType) {
        if (urlType === 'community') {
            const match = url.match(/(?:twitter\.com|x\.com)\/i\/communities\/([0-9]+)/);
            return match ? match[1] : null;
        }
        if (urlType !== 'profile') return null;
        const cleanUrl = url.split('?')[0].split('#')[0];
        const patterns = [
            /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})(?:\/|$)/,
            /(?:twitter\.com|x\.com)\/@([a-zA-Z0-9_]{1,15})/,
            /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,15})\/status\/[0-9]+/
        ];
        for (const pattern of patterns) {
            const match = cleanUrl.match(pattern);
            if (match) {
                const username = match[1];
                if (['i', 'search', 'intent', 'list', 'home', 'explore'].includes(username.toLowerCase())) return null;
                return username;
            }
        }
        return null;
    }

    function findPostContentContainer(startEl) {
        let el = startEl;
        while (el) {
            if (
                el.classList &&
                el.classList.contains('flex') &&
                el.classList.contains('flex-col') &&
                el.classList.contains('flex-1')
            ) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function abbreviateNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
        return num;
    }
})();