import userAPI from './app.mjs';

console.log('🔍 调试登出功能\n');

// 注册并登录用户
const registerResult = userAPI.register({
    username: 'logouttest',
    email: 'logout@example.com',
    password: 'logout123'
});

if (registerResult.success) {
    console.log('✅ 注册成功');
    
    const loginResult = userAPI.login({
        username: 'logouttest',
        password: 'logout123'
    });
    
    if (loginResult.success) {
        console.log('✅ 登录成功');
        const sessionToken = loginResult.data.sessionToken;
        
        // 登出前查询会话状态
        console.log('\n=== 登出前会话状态 ===');
        userAPI.db.transaction(tx => {
            const result = tx.executeSql('SELECT * FROM user_sessions WHERE session_token = ?', [sessionToken]);
            if (result.rows.length > 0) {
                console.log('会话数据:', result.rows.item(0));
            }
        });
        
        // 执行登出
        console.log('\n=== 执行登出 ===');
        const logoutResult = userAPI.logout(sessionToken);
        console.log('登出结果:', logoutResult);
        
        // 登出后查询会话状态
        console.log('\n=== 登出后会话状态 ===');
        userAPI.db.transaction(tx => {
            const result = tx.executeSql('SELECT * FROM user_sessions WHERE session_token = ?', [sessionToken]);
            if (result.rows.length > 0) {
                console.log('会话数据:', result.rows.item(0));
            } else {
                console.log('会话不存在');
            }
        });
        
        // 测试登出后的会话验证
        console.log('\n=== 登出后会话验证 ===');
        const validateResult = userAPI.validateSession(sessionToken);
        console.log('验证结果:', validateResult);
    }
}