import userAPI from './app.mjs';

// 用户管理API使用示例
class UserManagementExample {
    constructor() {
        this.currentUser = null;
        this.currentSession = null;
    }

    // 演示完整的用户管理流程
    demonstrateUserManagement() {
        console.log('🎯 用户管理API使用示例\n');

        // 1. 创建管理员账户
        this.createAdminAccount();

        // 2. 创建普通用户账户
        this.createUserAccounts();

        // 3. 演示登录流程
        this.demonstrateLogin();

        // 4. 演示会话管理
        this.demonstrateSessionManagement();

        // 5. 演示用户信息管理
        this.demonstrateUserInfoManagement();

        // 6. 演示管理员功能
        this.demonstrateAdminFeatures();

        // 7. 演示安全功能
        this.demonstrateSecurityFeatures();

        console.log('\n✅ 示例演示完成！');
    }

    // 创建管理员账户
    createAdminAccount() {
        console.log('👑 创建管理员账户');

        const adminData = {
            username: 'admin',
            email: 'admin@company.com',
            password: 'admin123456',
            userRole: 'admin',
            profileData: {
                nickname: '系统管理员',
                department: 'IT部门',
                phone: '13800138000'
            }
        };

        const result = userAPI.register(adminData);
        if (result.success) {
            console.log('✅ 管理员账户创建成功');
            console.log(`用户ID: ${result.data.userId}`);
            console.log(`用户名: ${result.data.username}`);
        } else {
            console.log('❌ 管理员账户创建失败:', result.message);
        }
    }

    // 创建普通用户账户
    createUserAccounts() {
        console.log('\n👥 创建普通用户账户');

        const users = [
            {
                username: 'alice',
                email: 'alice@example.com',
                password: 'alice123',
                profileData: {
                    nickname: 'Alice',
                    age: 28,
                    city: '北京'
                }
            },
            {
                username: 'bob',
                email: 'bob@example.com',
                password: 'bob123456',
                profileData: {
                    nickname: 'Bob',
                    age: 32,
                    city: '上海'
                }
            },
            {
                username: 'charlie',
                email: 'charlie@example.com',
                password: 'charlie789',
                profileData: {
                    nickname: 'Charlie',
                    age: 25,
                    city: '广州'
                }
            }
        ];

        users.forEach((userData, index) => {
            const result = userAPI.register(userData);
            if (result.success) {
                console.log(`✅ 用户 ${userData.username} 创建成功 (ID: ${result.data.userId})`);
            } else {
                console.log(`❌ 用户 ${userData.username} 创建失败: ${result.message}`);
            }
        });
    }

    // 演示登录流程
    demonstrateLogin() {
        console.log('\n🔐 演示登录流程');

        // 管理员登录
        console.log('管理员登录...');
        const adminLogin = userAPI.login({
            username: 'admin',
            password: 'admin123456',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        if (adminLogin.success) {
            console.log('✅ 管理员登录成功');
            console.log(`会话令牌: ${adminLogin.data.sessionToken.substring(0, 20)}...`);
            console.log(`会话过期时间: ${adminLogin.data.expiresAt}`);
            this.currentUser = adminLogin.data;
            this.currentSession = adminLogin.data.sessionToken;
        } else {
            console.log('❌ 管理员登录失败:', adminLogin.message);
        }

        // 普通用户登录
        console.log('\n普通用户登录...');
        const userLogin = userAPI.login({
            username: 'alice',
            password: 'alice123',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        });

        if (userLogin.success) {
            console.log('✅ 用户 Alice 登录成功');
            console.log(`用户角色: ${userLogin.data.userRole}`);
            console.log(`个人资料: ${JSON.stringify(userLogin.data.profileData)}`);
        } else {
            console.log('❌ 用户登录失败:', userLogin.message);
        }
    }

    // 演示会话管理
    demonstrateSessionManagement() {
        console.log('\n🔍 演示会话管理');

        if (!this.currentSession) {
            console.log('❌ 没有有效的会话');
            return;
        }

        // 验证当前会话
        const sessionValidation = userAPI.validateSession(this.currentSession);
        if (sessionValidation.success) {
            console.log('✅ 会话验证成功');
            console.log(`当前用户: ${sessionValidation.data.username}`);
            console.log(`用户角色: ${sessionValidation.data.userRole}`);
        } else {
            console.log('❌ 会话验证失败:', sessionValidation.message);
        }

        // 演示无效会话
        const invalidSession = userAPI.validateSession('invalid_token_12345');
        console.log(`无效会话验证结果: ${invalidSession.success ? '通过' : '失败'} - ${invalidSession.message}`);
    }

    // 演示用户信息管理
    demonstrateUserInfoManagement() {
        console.log('\n✏️ 演示用户信息管理');

        if (!this.currentSession) {
            console.log('❌ 需要登录才能管理用户信息');
            return;
        }

        // 更新当前用户的个人资料
        const updateResult = userAPI.updateUser(this.currentUser.userId, {
            profileData: {
                nickname: '超级管理员',
                department: 'IT部门',
                phone: '13800138000',
                lastUpdated: new Date().toISOString()
            }
        }, this.currentSession);

        if (updateResult.success) {
            console.log('✅ 用户信息更新成功');
        } else {
            console.log('❌ 用户信息更新失败:', updateResult.message);
        }

        // 验证更新后的信息
        const updatedSession = userAPI.validateSession(this.currentSession);
        if (updatedSession.success) {
            console.log('更新后的个人资料:', updatedSession.data.profileData);
        }
    }

    // 演示管理员功能
    demonstrateAdminFeatures() {
        console.log('\n👑 演示管理员功能');

        if (!this.currentSession || this.currentUser.userRole !== 'admin') {
            console.log('❌ 需要管理员权限');
            return;
        }

        // 获取用户列表
        console.log('获取用户列表...');
        const userList = userAPI.getUserList(this.currentSession, 1, 10);
        if (userList.success) {
            console.log(`✅ 获取到 ${userList.data.users.length} 个用户:`);
            userList.data.users.forEach(user => {
                console.log(`  - ${user.username} (${user.email}) - 角色: ${user.user_role} - 状态: ${user.is_active ? '活跃' : '禁用'}`);
            });
            console.log(`分页信息: 第${userList.data.pagination.page}页，共${userList.data.pagination.totalPages}页`);
        } else {
            console.log('❌ 获取用户列表失败:', userList.message);
        }

        // 获取操作日志
        console.log('\n获取操作日志...');
        const logs = userAPI.getLogs(this.currentSession, 1, 5);
        if (logs.success) {
            console.log(`✅ 获取到 ${logs.data.logs.length} 条日志:`);
            logs.data.logs.forEach(log => {
                console.log(`  - ${log.timestamp}: ${log.action} (用户: ${log.username || '系统'}) - ${log.success ? '成功' : '失败'}`);
            });
        } else {
            console.log('❌ 获取日志失败:', logs.message);
        }

        // 管理员更新其他用户信息
        console.log('\n管理员更新用户信息...');
        // 先找到一个普通用户
        if (userList.success && userList.data.users.length > 1) {
            const targetUser = userList.data.users.find(u => u.user_role === 'user');
            if (targetUser) {
                const adminUpdate = userAPI.updateUser(targetUser.id, {
                    userRole: 'vip',
                    isActive: true
                }, this.currentSession);

                if (adminUpdate.success) {
                    console.log(`✅ 管理员成功更新用户 ${targetUser.username} 的信息`);
                } else {
                    console.log(`❌ 管理员更新用户信息失败: ${adminUpdate.message}`);
                }
            }
        }
    }

    // 演示安全功能
    demonstrateSecurityFeatures() {
        console.log('\n🔒 演示安全功能');

        // 演示密码错误锁定
        console.log('演示密码错误锁定机制...');
        for (let i = 1; i <= 6; i++) {
            const failedLogin = userAPI.login({
                username: 'alice',
                password: 'wrongpassword'
            });
            console.log(`第${i}次错误登录尝试: ${failedLogin.message}`);
            
            if (failedLogin.message.includes('锁定')) {
                break;
            }
        }

        // 演示权限控制
        console.log('\n演示权限控制...');
        
        // 普通用户尝试获取用户列表
        const bobLogin = userAPI.login({
            username: 'bob',
            password: 'bob123456'
        });

        if (bobLogin.success) {
            const unauthorizedAccess = userAPI.getUserList(bobLogin.data.sessionToken);
            console.log(`普通用户尝试获取用户列表: ${unauthorizedAccess.success ? '成功' : '失败'} - ${unauthorizedAccess.message}`);

            // 普通用户尝试删除其他用户
            const unauthorizedDelete = userAPI.deleteUser(this.currentUser.userId, bobLogin.data.sessionToken);
            console.log(`普通用户尝试删除管理员: ${unauthorizedDelete.success ? '成功' : '失败'} - ${unauthorizedDelete.message}`);
        }

        // 演示会话过期（模拟）
        console.log('\n演示会话管理...');
        const expiredToken = 'expired_token_12345';
        const expiredValidation = userAPI.validateSession(expiredToken);
        console.log(`过期会话验证: ${expiredValidation.success ? '通过' : '失败'} - ${expiredValidation.message}`);
    }

    // 清理演示数据
    cleanup() {
        console.log('\n🧹 清理演示数据');

        if (this.currentSession && this.currentUser.userRole === 'admin') {
            // 获取所有用户并删除（除了管理员自己）
            const userList = userAPI.getUserList(this.currentSession);
            if (userList.success) {
                userList.data.users.forEach(user => {
                    if (user.id !== this.currentUser.userId) {
                        const deleteResult = userAPI.deleteUser(user.id, this.currentSession);
                        console.log(`删除用户 ${user.username}: ${deleteResult.success ? '成功' : '失败'}`);
                    }
                });
            }

            // 管理员登出
            const logoutResult = userAPI.logout(this.currentSession);
            console.log(`管理员登出: ${logoutResult.success ? '成功' : '失败'}`);
        }
    }
}

// 运行示例
console.log('🚀 启动用户管理API示例演示\n');

const example = new UserManagementExample();
example.demonstrateUserManagement();

// 可选：清理演示数据
// example.cleanup();