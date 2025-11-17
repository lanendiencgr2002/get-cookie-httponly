// 注入到页面MAIN world的脚本
(function() {
    let cachedCookies = [];
    let cacheTimestamp = 0;
    const CACHE_DURATION = 3000; // 缓存3秒
    const COOKIE_INPUT_ID = 'cookie-extension-data';
    
    // 创建或获取隐藏的input元素
    function getCookieInput() {
        let input = document.getElementById(COOKIE_INPUT_ID);
        if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.id = COOKIE_INPUT_ID;
            input.setAttribute('data-cookie-extension', 'true');
            
            // 安全地挂载到DOM - 优先使用body，如果不存在则使用documentElement
            const mountPoint = document.body || document.documentElement;
            if (mountPoint) {
                mountPoint.appendChild(input);
            }
            
            // 立即添加自定义方法到新创建的input元素
            setupInputMethods(input);
        }
        return input;
    }
    
    // 更新缓存和input元素
    async function updateCache() {
        try {
            const result = await new Promise((resolve) => {
                const requestId = Date.now();
                window.postMessage({
                    type: 'GET_COOKIES_WITH_HTTPONLY',
                    id: requestId
                }, '*');
                
                const listener = function(event) {
                    if (event.data.type === 'COOKIES_RESPONSE' && event.data.id === requestId) {
                        window.removeEventListener('message', listener);
                        resolve({
                            cookies: event.data.cookies || [],
                            error: event.data.error
                        });
                    }
                };
                window.addEventListener('message', listener);
                
                // 缩短超时时间到2秒
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve({
                        cookies: [],
                        error: 'Request timeout'
                    });
                }, 2000);
            });
            
            // 检查是否有错误
            if (result.error) {
                if (result.error.includes('Extension context invalidated')) {
                    console.warn('🍪 Cookie Extension: 扩展上下文已失效，请刷新页面以恢复功能');
                } else {
                    console.warn('🍪 Cookie Extension: 获取 cookies 失败 -', result.error);
                }
                // 即使出错也保留旧的缓存数据，不清空
                return;
            }
            
            cachedCookies = result.cookies;
            cacheTimestamp = Date.now();
            
            // 将cookie数据存储到隐藏input元素中
            const input = getCookieInput();
            input.value = JSON.stringify({
                cookies: result.cookies,
                timestamp: cacheTimestamp
            });
            
            console.log('🍪 Cookie数据已更新到隐藏input元素，包含', result.cookies.length, '个cookies');
        } catch (error) {
            console.error('🍪 更新cookie数据失败:', error);
        }
    }
    
    // 从input元素读取cookie数据
    function getCookiesFromInput() {
        const input = document.getElementById(COOKIE_INPUT_ID);
        if (!input || !input.value) {
            return [];
        }
        
        try {
            const data = JSON.parse(input.value);
            return data.cookies || [];
        } catch (error) {
            console.error('解析cookie数据失败:', error);
            return [];
        }
    }
    
    // 获取指定cookie
    function getCookieByName(name) {
        const cookies = getCookiesFromInput();
        return cookies.find(c => c.name === name) || null;
    }
    
    // 获取cookie字符串
    function getCookieString() {
        const cookies = getCookiesFromInput();
        return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    }
    
    // 手动刷新缓存
    async function refreshCache() {
        await updateCache();
        return getCookiesFromInput();
    }
    
    // 在input元素上添加自定义方法（通过data属性）
    function setupInputMethods(input) {
        // 如果没有传入input参数，则获取已存在的input元素
        if (!input) {
            input = document.getElementById(COOKIE_INPUT_ID);
        }
        
        if (!input) return; // 如果还是没有input元素，直接返回
        
        // 添加获取所有cookies的方法
        input.getAllCookies = getCookiesFromInput;
        
        // 添加获取指定cookie的方法
        input.getCookie = getCookieByName;
        
        // 添加获取cookie字符串的方法
        input.getCookieString = getCookieString;
        
        // 添加刷新缓存的方法
        input.refreshCache = refreshCache;
        
        // 添加帮助方法
        input.help = function() {
            console.log(`
🍪 Cookie Extension API 使用方法:

const cookieInput = document.getElementById('${COOKIE_INPUT_ID}');

cookieInput.getAllCookies()
  - 返回 Cookie[] 获取所有 cookies (包括 HttpOnly)

cookieInput.getCookie(name)
  - 返回 Cookie|null 获取指定名称的 cookie (包括 HttpOnly)

cookieInput.getCookieString()
  - 返回 string 获取格式化的 cookie 字符串 (包括 HttpOnly)

await cookieInput.refreshCache()
  - 手动刷新缓存并返回最新数据

cookieInput.help()
  - 显示此帮助信息

特点: 
- 数据存储在隐藏的input元素中，不污染window对象
- 包含HttpOnly cookies
- 自动每3秒刷新数据
- 页面加载时立即获取数据

使用示例:
  const cookieInput = document.getElementById('${COOKIE_INPUT_ID}');
  cookieInput.getAllCookies()
  cookieInput.getCookie('session_id')
  cookieInput.getCookieString()
            `);
        };
    }
    
    // 页面加载时立即创建input元素并添加方法
    getCookieInput(); // 这会创建input并自动调用setupInputMethods
    
    // 然后立即更新缓存
    updateCache();
    
    // 定期刷新缓存
    setInterval(updateCache, CACHE_DURATION);
    
    console.log(`🍪 Cookie Extension 已加载! Cookie数据存储在id为'${COOKIE_INPUT_ID}'的隐藏input元素中`);
    console.log(`使用 document.getElementById('${COOKIE_INPUT_ID}').help() 查看可用方法`);
})();
