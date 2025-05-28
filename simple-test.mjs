import userAPI from './app.mjs';

console.log('🧪 简单功能测试\n');

// 测试1: 注册用户
console.log('1. 测试用户注册...');
const registerResult = userAPI.register({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
});
console.log('注册结果:', registerResult);

if (registerResult.success) {
    const userId = registerResult.data.userId;
    
    // 测试2: 用户登录
    console.log('\n2. 测试用户登录...');
    const loginResult = userAPI.login({
        username: 'testuser',
        password: 'password123'
    });
    console.log('登录结果:', loginResult);
    
    if (loginResult.success) {
        const sessionToken = loginResult.data.sessionToken;
        
        // 测试3: 验证会话
        console.log('\n3. 测试会话验证...');
        const validateResult = userAPI.validateSession(sessionToken);
        console.log('验证结果:', validateResult);
        
        // 测试4: 登出
        console.log('\n4. 测试用户登出...');
        const logoutResult = userAPI.logout(sessionToken);
        console.log('登出结果:', logoutResult);
        
        // 测试5: 登出后验证会话
        console.log('\n5. 测试登出后会话验证...');
        const validateAfterLogout = userAPI.validateSession(sessionToken);
        console.log('登出后验证结果:', validateAfterLogout);
    }
}

console.log('\n✅ 简单测试完成！');