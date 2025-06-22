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
    
    // Сохраняем контроллер для возможной отмены
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
});