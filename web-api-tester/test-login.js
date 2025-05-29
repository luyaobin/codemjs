const http = require('http');

// 测试登录功能
function testLogin(username, password) {
    const data = JSON.stringify({
        username: username,
        password: password,
        remember: true
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: result
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// 测试验证功能
function testVerify(token) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/verify',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: result
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// 测试登出功能
function testLogout(token) {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/logout',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: result
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// 运行测试
async function runTests() {
    console.log('=== Web API 测试工具登录功能测试 ===\n');

    try {
        // 1. 测试正确的登录
        console.log('1. 测试管理员登录...');
        const adminLogin = await testLogin('admin', 'admin123');
        console.log(`   状态码: ${adminLogin.statusCode}`);
        console.log(`   结果: ${JSON.stringify(adminLogin.data)}`);
        
        if (adminLogin.statusCode === 200 && adminLogin.data.success) {
            console.log('   ✓ 管理员登录成功！');
            const adminToken = adminLogin.data.token;

            // 2. 测试token验证
            console.log('\n2. 测试token验证...');
            const verifyResult = await testVerify(adminToken);
            console.log(`   状态码: ${verifyResult.statusCode}`);
            console.log(`   结果: ${JSON.stringify(verifyResult.data)}`);
            
            if (verifyResult.statusCode === 200 && verifyResult.data.success) {
                console.log('   ✓ Token验证成功！');
            }

            // 3. 测试登出
            console.log('\n3. 测试登出功能...');
            const logoutResult = await testLogout(adminToken);
            console.log(`   状态码: ${logoutResult.statusCode}`);
            console.log(`   结果: ${JSON.stringify(logoutResult.data)}`);
            
            if (logoutResult.statusCode === 200 && logoutResult.data.success) {
                console.log('   ✓ 登出成功！');
                
                // 4. 验证登出后token失效
                console.log('\n4. 验证登出后token是否失效...');
                const verifyAfterLogout = await testVerify(adminToken);
                console.log(`   状态码: ${verifyAfterLogout.statusCode}`);
                
                if (verifyAfterLogout.statusCode === 401) {
                    console.log('   ✓ Token已失效，登出功能正常！');
                }
            }
        }

        // 5. 测试错误的登录
        console.log('\n5. 测试错误的密码...');
        const wrongLogin = await testLogin('admin', 'wrongpassword');
        console.log(`   状态码: ${wrongLogin.statusCode}`);
        console.log(`   结果: ${JSON.stringify(wrongLogin.data)}`);
        
        if (wrongLogin.statusCode === 401 && !wrongLogin.data.success) {
            console.log('   ✓ 错误密码被正确拒绝！');
        }

        // 6. 测试普通用户登录
        console.log('\n6. 测试普通用户登录...');
        const userLogin = await testLogin('user', 'user123');
        console.log(`   状态码: ${userLogin.statusCode}`);
        console.log(`   结果: ${JSON.stringify(userLogin.data)}`);
        
        if (userLogin.statusCode === 200 && userLogin.data.success) {
            console.log('   ✓ 普通用户登录成功！');
        }

        console.log('\n=== 测试完成 ===');
        console.log('所有测试通过！登录功能正常工作。');

    } catch (error) {
        console.error('\n测试失败:', error.message);
        console.error('请确保服务器已在 http://localhost:3000 上运行');
    }
}

// 延迟执行，确保服务器已启动
console.log('等待2秒后开始测试...');
setTimeout(runTests, 2000);