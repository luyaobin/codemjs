import userAPI from './app.mjs';

console.log('🔍 调试会话验证问题\n');

// 注册并登录用户
const registerResult = userAPI.register({
    username: 'debuguser',
    email: 'debug@example.com',
    password: 'debug123'
});

if (registerResult.success) {
    console.log('注册成功');
    
    const loginResult = userAPI.login({
        username: 'debuguser',
        password: 'debug123'
    });
    
    if (loginResult.success) {
        console.log('登录成功');
        const sessionToken = loginResult.data.sessionToken;
        
        // 直接查询数据库看看数据结构
        userAPI.db.transaction(tx => {
            console.log('\n=== 查询用户表 ===');
            const userResult = tx.executeSql('SELECT * FROM users WHERE id = 1');
            if (userResult.rows.length > 0) {
                console.log('用户数据:', userResult.rows.item(0));
            }
            
            console.log('\n=== 查询会话表 ===');
            const sessionResult = tx.executeSql('SELECT * FROM user_sessions WHERE session_token = ?', [sessionToken]);
            if (sessionResult.rows.length > 0) {
                console.log('会话数据:', sessionResult.rows.item(0));
            }
            
            console.log('\n=== 查询联合表 ===');
            const joinResult = tx.executeSql(`
                SELECT s.*, u.username, u.email, u.user_role, u.is_active, u.profile_data
                FROM user_sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ? AND s.is_active = 1
            `, [sessionToken]);
            if (joinResult.rows.length > 0) {
                console.log('联合查询数据:', joinResult.rows.item(0));
            }
        });
        
        // 测试登出
        console.log('\n=== 测试登出 ===');
        const logoutResult = userAPI.logout(sessionToken);
        console.log('登出结果:', logoutResult);
        
        // 登出后查询会话
        userAPI.db.transaction(tx => {
            const sessionResult = tx.executeSql('SELECT * FROM user_sessions WHERE session_token = ?', [sessionToken]);
            if (sessionResult.rows.length > 0) {
                console.log('登出后会话数据:', sessionResult.rows.item(0));
            }
        });
    }
}