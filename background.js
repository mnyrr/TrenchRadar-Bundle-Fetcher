// background.js
const activeRequests = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getCookies') {
        chrome.cookies.getAll({ domain: request.domain }, cookies => {
            sendResponse({ cookies });
        });
        return true;
    }


    
    if (request.action === 'fetchData') {
        const controller = new AbortController();
        const { signal } = controller;
        
        activeRequests.set(request.requestId, controller);
        
        fetch(request.url, {
            method: 'GET',
            headers: request.headers,
            signal
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ data });
            activeRequests.delete(request.requestId);
        })
        .catch(error => {
            sendResponse({ error: error.message });
            activeRequests.delete(request.requestId);
        });
        
        return true;
    }
    
    if (request.action === 'abortRequest') {
        const controller = activeRequests.get(request.requestId);
        if (controller) {
            controller.abort();
            activeRequests.delete(request.requestId);
        }
        return true;
    }
    
    if (request.action === 'twitterFetch') {
        const controller = new AbortController();
        const { signal } = controller;
        const requestId = 'twitter_' + Date.now();
        
        activeRequests.set(requestId, controller);
        
        fetch(request.url, {
            method: 'GET',
            headers: request.headers,
            signal
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ data });
            activeRequests.delete(requestId);
        })
        .catch(error => {
            sendResponse({ error: error.message });
            activeRequests.delete(requestId);
        });
        
        return true;
    }
    
    if (request.action === 'axiomCommunityFetch') {
    const controller = new AbortController();
    const { signal } = controller;
    const requestId = 'axiom_comm_' + Date.now();
        
        activeRequests.set(requestId, controller);
        
        fetch(request.url, {
            method: 'GET',
            headers: request.headers,
            signal
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ data });
            activeRequests.delete(requestId);
        })
        .catch(error => {
            sendResponse({ error: error.message });
            activeRequests.delete(requestId);
        });
        
        return true;
    }
    
    if (request.action === 'getTwitterCheckStatus') {
        chrome.storage.local.get('twitterCheckEnabled', (data) => {
            sendResponse({ enabled: data.twitterCheckEnabled !== false });
        });
        return true;
    }


});

// Инициализация состояния по умолчанию
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get('twitterCheckEnabled', (data) => {
        if (data.twitterCheckEnabled === undefined) {
            chrome.storage.local.set({ 'twitterCheckEnabled': true });
        }
    });
});