// 注入到页面MAIN world的脚本
(function() {
    let cachedCookies = [];
    let cacheTimestamp = 0;
    const CACHE_DURATION = 3000; // 缓存3秒
    
    // 更新缓存
    async function updateCache() {
        try {
            const cookies = await new Promise((resolve) => {
                const requestId = Date.now();
                window.postMessage({
                    type: 'GET_COOKIES_WITH_HTTPONLY',
                    id: requestId
                }, '*');
                
                const listener = function(event) {
                    if (event.data.type === 'COOKIES_RESPONSE' && event.data.id === requestId) {
                        window.removeEventListener('message', listener);
                        resolve(event.data.cookies || []);
                    }
                };
                window.addEventListener('message', listener);
                
                setTimeout(() => {
                    window.removeEventListener('message', listener);
                    resolve([]);
                }, 5000);
            });
            
            cachedCookies = cookies;
            cacheTimestamp = Date.now();
            console.log('🍪 Cookie缓存已更新，包含', cookies.length, '个cookies');
        } catch (error) {
            console.error('更新cookie缓存失败:', error);
        }
    }
    
    window.getCookieExtension = {
        // 同步获取所有cookies（包括HttpOnly）
        getAllCookies: function() {
            return cachedCookies;
        },
        
        // 同步获取指定cookie（包括HttpOnly）
        getCookie: function(name) {
            return cachedCookies.find(c => c.name === name) || null;
        },
        
        // 同步获取cookie字符串（包括HttpOnly）
        getCookieString: function() {
            return cachedCookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        },
        
        // 手动刷新缓存
        refreshCache: async function() {
            await updateCache();
            return cachedCookies;
        },
        
        help: function() {
            console.log(`
🍪 Cookie Extension API 可用函数:

window.getCookieExtension.getAllCookies()
  - 返回 Cookie[] 获取所有 cookies (包括 HttpOnly)

window.getCookieExtension.getCookie(name)
  - 返回 Cookie|null 获取指定名称的 cookie (包括 HttpOnly)

window.getCookieExtension.getCookieString()
  - 返回 string 获取格式化的 cookie 字符串 (包括 HttpOnly)

await window.getCookieExtension.refreshCache()
  - 手动刷新缓存并返回最新数据

window.getCookieExtension.help()
  - 显示此帮助信息

特点: 
- 所有函数都是同步的，立即返回结果
- 包含HttpOnly cookies
- 自动每3秒刷新缓存
- 页面加载时立即获取数据

使用示例:
  window.getCookieExtension.getAllCookies()
  window.getCookieExtension.getCookie('session_id')
  window.getCookieExtension.getCookieString()
            `);
        }
    };
    
    // 页面加载时立即更新缓存
    updateCache();
    
    // 定期刷新缓存
    setInterval(updateCache, CACHE_DURATION);
    
    console.log('🍪 Cookie Extension 已加载! 使用 window.getCookieExtension.help() 查看可用函数');
})();
