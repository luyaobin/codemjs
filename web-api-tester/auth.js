// 认证相关的共享函数

// 检查用户是否已登录
function checkAuth() {
    const token = localStorage.getItem('apiTestToken');
    const tokenExpiry = localStorage.getItem('apiTestTokenExpiry');
    
    if (!token || !tokenExpiry) {
        // 未登录，跳转到登录页
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    
    const now = new Date().getTime();
    if (now >= parseInt(tokenExpiry)) {
        // Token已过期，清除并跳转到登录页
        clearAuth();
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        return null;
    }
    
    // 返回用户信息
    const userStr = localStorage.getItem('apiTestUser');
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// 清除认证信息
function clearAuth() {
    localStorage.removeItem('apiTestToken');
    localStorage.removeItem('apiTestTokenExpiry');
    localStorage.removeItem('apiTestUser');
}

// 登出
async function logout() {
    const token = localStorage.getItem('apiTestToken');
    
    if (token) {
        try {
            // 通知服务器登出
            await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (e) {
            console.error('Logout error:', e);
        }
    }
    
    // 清除本地认证信息
    clearAuth();
    
    // 跳转到登录页
    window.location.href = '/login.html';
}

// 获取认证令牌
function getAuthToken() {
    return localStorage.getItem('apiTestToken');
}

// 创建用户信息显示组件
function createUserInfoWidget(user) {
    const widget = document.createElement('div');
    widget.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 10px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 15px;
        z-index: 1000;
        font-size: 14px;
    `;
    
    widget.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 20px;">👤</span>
            <div>
                <div style="font-weight: 600; color: #1a202c;">${user.name || user.username}</div>
                <div style="font-size: 12px; color: #718096;">${user.role === 'admin' ? '管理员' : '普通用户'}</div>
            </div>
        </div>
        <button onclick="logout()" style="
            padding: 6px 16px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
        " onmouseover="this.style.background='#dc2626'" 
           onmouseout="this.style.background='#ef4444'">
            登出
        </button>
    `;
    
    return widget;
}

// 添加请求拦截器，自动添加认证头
function setupAuthInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        let [url, options = {}] = args;
        
        // 如果是API请求，自动添加认证头
        if (url.startsWith('/api/') || url.includes('/api/')) {
            const token = getAuthToken();
            if (token) {
                options.headers = options.headers || {};
                options.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return originalFetch.apply(this, [url, options]);
    };
}

// 初始化认证
function initAuth() {
    const user = checkAuth();
    if (user) {
        // 显示用户信息
        document.body.appendChild(createUserInfoWidget(user));
        
        // 设置请求拦截器
        setupAuthInterceptor();
        
        return user;
    }
    return null;
}

// 导出给页面使用
window.authUtils = {
    checkAuth,
    clearAuth,
    logout,
    getAuthToken,
    initAuth
};