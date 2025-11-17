// Content script - 注入到网页中
(function() {
    // 检查扩展上下文是否有效
    function isExtensionContextValid() {
        try {
            // 尝试访问 chrome.runtime.id，如果扩展上下文失效会抛出错误
            return !!(chrome && chrome.runtime && chrome.runtime.id);
        } catch (error) {
            // 如果抛出错误，说明扩展上下文已失效
            return false;
        }
    }
    
    // 发送错误响应回 MAIN world
    function sendErrorResponse(requestId, errorMessage) {
        window.postMessage({
            type: 'COOKIES_RESPONSE',
            id: requestId,
            cookies: [],
            error: errorMessage
        }, '*');
    }
    
    // 监听来自MAIN world的消息
    window.addEventListener('message', function(event) {
        if (event.data.type === 'GET_COOKIES_WITH_HTTPONLY') {
            const requestId = event.data.id;
            
            // 检查扩展上下文是否有效
            if (!isExtensionContextValid()) {
                console.warn('🍪 Cookie Extension: 扩展上下文已失效，请刷新页面');
                sendErrorResponse(requestId, 'Extension context invalidated');
                return;
            }
            
            // 转发到background script
            try {
                chrome.runtime.sendMessage({
                    action: "getCookies"
                }, function(response) {
                    // 检查是否有运行时错误
                    if (chrome.runtime.lastError) {
                        const errorMsg = chrome.runtime.lastError.message;
                        console.warn('🍪 Cookie Extension: 消息发送失败 -', errorMsg);
                        sendErrorResponse(requestId, errorMsg);
                        return;
                    }
                    
                    if (response && response.success) {
                        // 发送响应回MAIN world
                        window.postMessage({
                            type: 'COOKIES_RESPONSE',
                            id: requestId,
                            cookies: response.cookies
                        }, '*');
                    } else {
                        // 如果响应无效，发送空数组
                        sendErrorResponse(requestId, 'Invalid response from background');
                    }
                });
            } catch (error) {
                // 捕获任何同步错误（包括 "Extension context invalidated"）
                console.warn('🍪 Cookie Extension: 发生错误 -', error.message);
                sendErrorResponse(requestId, error.message);
            }
        }
    });
    
    console.log('🍪 Cookie Extension Content Script 已加载');
})();
