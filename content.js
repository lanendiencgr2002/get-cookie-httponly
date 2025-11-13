// Content script - 注入到网页中
(function() {
    // 注册全局函数到 window 对象
    window.getCookieExtension = {
        // 获取当前域名的所有 cookies
        getAllCookies: function() {
            const cookies = [];
            document.cookie.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) {
                    cookies.push({
                        name: name,
                        value: value,
                        domain: window.location.hostname,
                        path: '/',
                        httpOnly: false, // 通过 document.cookie 无法获取 HttpOnly cookies
                        secure: window.location.protocol === 'https:',
                        session: true
                    });
                }
            });
            return cookies;
        },
        
        // 获取指定名称的 cookie
        getCookie: function(name) {
            const cookies = this.getAllCookies();
            return cookies.find(c => c.name === name) || null;
        },
        
        // 获取格式化的 cookie 字符串
        getCookieString: function() {
            return document.cookie;
        },
        
        // 显示帮助信息
        help: function() {
            console.log(`
🍪 Cookie Extension API 可用函数:

window.getCookieExtension.getAllCookies()
  - 返回 Cookie[] 获取所有 cookies (非 HttpOnly)

window.getCookieExtension.getCookie(name)
  - 返回 Cookie|null 获取指定名称的 cookie

window.getCookieExtension.getCookieString()
  - 返回 string 获取格式化的 cookie 字符串

window.getCookieExtension.help()
  - 显示此帮助信息

使用示例:
  window.getCookieExtension.getAllCookies()
  window.getCookieExtension.getCookie('session_id')
  window.getCookieExtension.getCookieString()

注意: 此版本使用 document.cookie API，无法获取 HttpOnly cookies
如需获取 HttpOnly cookies，请使用插件的弹窗功能
            `);
        }
    };
    
    // 在控制台显示可用函数
    console.log('🍪 Cookie Extension 已加载! 使用 window.getCookieExtension.help() 查看可用函数');
})();
