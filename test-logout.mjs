import userAPI from './app.mjs';

console.log('测试登出功能');

// 注册用户
const user = userAPI.register({
    username: 'testlogout',
    email: 'testlogout@example.com', 
    password: 'password123'
});

console.log('注册结果:', user);

if (user.success) {
    // 登录
    const login = userAPI.login({
        username: 'testlogout',
        password: 'password123'
    });
    
    console.log('登录结果:', login);
    
    if (login.success) {
        const token = login.data.sessionToken;
        console.log('会话令牌:', token);
        
        // 验证会话
        const validate1 = userAPI.validateSession(token);
        console.log('登出前验证:', validate1.success);
        
        // 登出
        const logout = userAPI.logout(token);
        console.log('登出结果:', logout);
        
        // 再次验证会话
        const validate2 = userAPI.validateSession(token);
        console.log('登出后验证:', validate2);
    }
}