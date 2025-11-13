// Content script - 注入到网页中
(function() {
    // 检查浏览器是否支持 MAIN world
    function registerMainWorldFunction() {
        // 尝试使用动态注入到 MAIN world (Chrome 102+)
        if (chrome.scripting && chrome.scripting.executeScript) {
            chrome.scripting.executeScript({
                target: { tabId: chrome.tabs ? chrome.tabs.TAB_ID_NONE : undefined },
                files: ["inject.js"],
                world: "MAIN"
            }).catch(() => {
                // 如果 MAIN world 失败，使用备用方案
                registerFallbackFunction();
            });
        } else {
            // 旧版本 Chrome 使用备用方案
            registerFallbackFunction();
        }
    }
    
    // 备用方案：在 ISOLATED world 中注册，并通过脚本注入到页面
    function registerFallbackFunction() {
        // 创建脚本标签注入到页面
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        document.documentElement.appendChild(script);
        script.remove();
    }
    
    // 根据环境选择注册方式
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        registerMainWorldFunction();
    } else {
        registerFallbackFunction();
    }
})();
