import userAPI from './app.mjs';

// 测试用户管理API的所有功能
class UserAPITester {
    constructor() {
        this.testResults = [];
        this.adminSessionToken = null;
        this.userSessionToken = null;
        this.testUserId = null;
        this.adminUserId = null;
    }

    // 记录测试结果
    logTest(testName, result, expected = true) {
        const success = result.success === expected;
        this.testResults.push({
            testName,
            success,
            result,
            expected
        });

        console.log(`\n=== ${testName} ===`);
        console.log(`状态: ${success ? '✅ 通过' : '❌ 失败'}`);
        console.log(`结果:`, result);
        
        if (!success) {
            console.log(`期望: success = ${expected}`);
        }
    }

    // 延迟函数
    sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // 同步延迟
        }
    }

    // 运行所有测试
    async runAllTests() {
        console.log('🚀 开始用户管理API测试\n');

        try {
            // 1. 测试用户注册
            await this.testUserRegistration();
            
            // 2. 测试管理员注册
            await this.testAdminRegistration();
            
            // 3. 测试用户登录
            await this.testUserLogin();
            
            // 4. 测试管理员登录
            await this.testAdminLogin();
            
            // 5. 测试会话验证
            await this.testSessionValidation();
            
            // 6. 测试用户信息更新
            await this.testUserUpdate();
            
            // 7. 测试获取用户列表
            await this.testGetUserList();
            
            // 8. 测试获取日志
            await this.testGetLogs();
            
            // 9. 测试用户登出
            await this.testUserLogout();
            
            // 10. 测试删除用户
            await this.testDeleteUser();
            
            // 11. 测试错误情况
            await this.testErrorCases();

            // 显示测试总结
            this.showTestSummary();

        } catch (error) {
            console.error('测试过程中发生错误:', error);
        }
    }

    // 测试用户注册
    testUserRegistration() {
        console.log('\n📝 测试用户注册功能');

        // 正常注册
        const result1 = userAPI.register({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            profileData: {
                nickname: '测试用户',
                age: 25
            }
        });
        this.logTest('正常用户注册', result1);
        
        if (result1.success) {
            this.testUserId = result1.data.userId;
        }

        // 重复注册（应该失败）
        const result2 = userAPI.register({
            username: 'testuser',
            email: 'test2@example.com',
            password: 'password123'
        });
        this.logTest('重复用户名注册（应该失败）', result2, false);

        // 密码太短（应该失败）
        const result3 = userAPI.register({
            username: 'testuser2',
            email: 'test3@example.com',
            password: '123'
        });
        this.logTest('密码太短注册（应该失败）', result3, false);
    }

    // 测试管理员注册
    testAdminRegistration() {
        console.log('\n👑 测试管理员注册功能');

        const result = userAPI.register({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123',
            userRole: 'admin',
            profileData: {
                nickname: '系统管理员'
            }
        });
        this.logTest('管理员注册', result);
        
        if (result.success) {
            this.adminUserId = result.data.userId;
        }
    }

    // 测试用户登录
    testUserLogin() {
        console.log('\n🔐 测试用户登录功能');

        // 正常登录
        const result1 = userAPI.login({
            username: 'testuser',
            password: 'password123',
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        });
        this.logTest('正常用户登录', result1);
        
        if (result1.success) {
            this.userSessionToken = result1.data.sessionToken;
        }

        // 错误密码登录（应该失败）
        const result2 = userAPI.login({
            username: 'testuser',
            password: 'wrongpassword'
        });
        this.logTest('错误密码登录（应该失败）', result2, false);

        // 不存在的用户登录（应该失败）
        const result3 = userAPI.login({
            username: 'nonexistentuser',
            password: 'password123'
        });
        this.logTest('不存在用户登录（应该失败）', result3, false);
    }

    // 测试管理员登录
    testAdminLogin() {
        console.log('\n👑 测试管理员登录功能');

        const result = userAPI.login({
            username: 'admin',
            password: 'admin123',
            ipAddress: '127.0.0.1',
            userAgent: 'Admin Browser'
        });
        this.logTest('管理员登录', result);
        
        if (result.success) {
            this.adminSessionToken = result.data.sessionToken;
        }
    }

    // 测试会话验证
    testSessionValidation() {
        console.log('\n🔍 测试会话验证功能');

        // 有效会话验证
        const result1 = userAPI.validateSession(this.userSessionToken);
        this.logTest('有效用户会话验证', result1);

        const result2 = userAPI.validateSession(this.adminSessionToken);
        this.logTest('有效管理员会话验证', result2);

        // 无效会话验证（应该失败）
        const result3 = userAPI.validateSession('invalid_token');
        this.logTest('无效会话验证（应该失败）', result3, false);

        // 空会话验证（应该失败）
        const result4 = userAPI.validateSession('');
        this.logTest('空会话验证（应该失败）', result4, false);
    }

    // 测试用户信息更新
    testUserUpdate() {
        console.log('\n✏️ 测试用户信息更新功能');

        // 用户更新自己的信息
        const result1 = userAPI.updateUser(this.testUserId, {
            email: 'newemail@example.com',
            profileData: {
                nickname: '更新的测试用户',
                age: 26,
                city: '北京'
            }
        }, this.userSessionToken);
        this.logTest('用户更新自己信息', result1);

        // 管理员更新用户信息
        const result2 = userAPI.updateUser(this.testUserId, {
            userRole: 'vip',
            isActive: true
        }, this.adminSessionToken);
        this.logTest('管理员更新用户信息', result2);

        // 用户尝试更新其他用户信息（应该失败）
        const result3 = userAPI.updateUser(this.adminUserId, {
            email: 'hacker@example.com'
        }, this.userSessionToken);
        this.logTest('用户更新他人信息（应该失败）', result3, false);
    }

    // 测试获取用户列表
    testGetUserList() {
        console.log('\n📋 测试获取用户列表功能');

        // 管理员获取用户列表
        const result1 = userAPI.getUserList(this.adminSessionToken, 1, 10);
        this.logTest('管理员获取用户列表', result1);

        // 普通用户获取用户列表（应该失败）
        const result2 = userAPI.getUserList(this.userSessionToken, 1, 10);
        this.logTest('普通用户获取用户列表（应该失败）', result2, false);
    }

    // 测试获取日志
    testGetLogs() {
        console.log('\n📊 测试获取日志功能');

        // 管理员获取所有日志
        const result1 = userAPI.getLogs(this.adminSessionToken, 1, 20);
        this.logTest('管理员获取所有日志', result1);

        // 管理员获取特定用户日志
        const result2 = userAPI.getLogs(this.adminSessionToken, 1, 10, this.testUserId);
        this.logTest('管理员获取特定用户日志', result2);

        // 普通用户获取日志（应该失败）
        const result3 = userAPI.getLogs(this.userSessionToken, 1, 10);
        this.logTest('普通用户获取日志（应该失败）', result3, false);
    }

    // 测试用户登出
    testUserLogout() {
        console.log('\n🚪 测试用户登出功能');

        // 正常登出
        const result1 = userAPI.logout(this.userSessionToken);
        this.logTest('用户正常登出', result1);

        // 登出后验证会话（应该失败）
        const result2 = userAPI.validateSession(this.userSessionToken);
        this.logTest('登出后会话验证（应该失败）', result2, false);

        // 重复登出
        const result3 = userAPI.logout(this.userSessionToken);
        this.logTest('重复登出', result3);
    }

    // 测试删除用户
    testDeleteUser() {
        console.log('\n🗑️ 测试删除用户功能');

        // 管理员删除用户
        const result1 = userAPI.deleteUser(this.testUserId, this.adminSessionToken);
        this.logTest('管理员删除用户', result1);

        // 删除不存在的用户（应该失败）
        const result2 = userAPI.deleteUser(99999, this.adminSessionToken);
        this.logTest('删除不存在用户（应该失败）', result2, false);

        // 无权限删除用户（重新登录一个普通用户测试）
        const newUser = userAPI.register({
            username: 'tempuser',
            email: 'temp@example.com',
            password: 'temp123'
        });
        
        if (newUser.success) {
            const loginResult = userAPI.login({
                username: 'tempuser',
                password: 'temp123'
            });
            
            if (loginResult.success) {
                const result3 = userAPI.deleteUser(this.adminUserId, loginResult.data.sessionToken);
                this.logTest('普通用户删除管理员（应该失败）', result3, false);
                
                // 清理临时用户
                userAPI.deleteUser(newUser.data.userId, this.adminSessionToken);
            }
        }
    }

    // 测试错误情况
    testErrorCases() {
        console.log('\n⚠️ 测试错误情况处理');

        // 空参数测试
        const result1 = userAPI.register({});
        this.logTest('空参数注册（应该失败）', result1, false);

        const result2 = userAPI.login({});
        this.logTest('空参数登录（应该失败）', result2, false);

        // 无效会话令牌测试
        const result3 = userAPI.updateUser(1, { email: 'test@test.com' }, 'invalid_token');
        this.logTest('无效令牌更新用户（应该失败）', result3, false);

        const result4 = userAPI.deleteUser(1, 'invalid_token');
        this.logTest('无效令牌删除用户（应该失败）', result4, false);
    }

    // 显示测试总结
    showTestSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 测试总结');
        console.log('='.repeat(50));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(test => test.success).length;
        const failedTests = totalTests - passedTests;

        console.log(`总测试数: ${totalTests}`);
        console.log(`通过: ${passedTests} ✅`);
        console.log(`失败: ${failedTests} ❌`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (failedTests > 0) {
            console.log('\n失败的测试:');
            this.testResults
                .filter(test => !test.success)
                .forEach(test => {
                    console.log(`- ${test.testName}: ${test.result.message}`);
                });
        }

        console.log('\n🎉 测试完成！');
    }
}

// 运行测试
const tester = new UserAPITester();
tester.runAllTests();