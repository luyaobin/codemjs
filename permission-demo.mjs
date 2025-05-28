import userAPIWithPermissions from './user-api-with-permissions.mjs';

// 权限管理演示类
class PermissionDemo {
    constructor() {
        this.api = userAPIWithPermissions.getProtectedUserAPI();
        this.adminToken = null;
        this.userToken = null;
        this.editorToken = null;
    }

    // 运行完整演示
    async runDemo() {
        console.log('🎯 权限管理系统完整演示');
        console.log('='.repeat(60));

        try {
            // 1. 初始化演示数据
            await this.initializeDemoData();
            
            // 2. 演示角色和权限管理
            await this.demonstrateRoleManagement();
            
            // 3. 演示用户权限分配
            await this.demonstrateUserPermissions();
            
            // 4. 演示权限检查
            await this.demonstratePermissionChecking();
            
            // 5. 演示权限冲突处理
            await this.demonstratePermissionConflicts();
            
            // 6. 演示权限日志
            await this.demonstratePermissionLogs();

            console.log('\n🎉 权限管理系统演示完成！');
            
        } catch (error) {
            console.error('❌ 演示过程中发生错误:', error);
        }
    }

    // 初始化演示数据
    async initializeDemoData() {
        console.log('\n📋 1. 初始化演示数据');
        console.log('-'.repeat(40));

        // 注册管理员用户
        const adminResult = this.api.registerWithRole({
            username: 'demo_admin',
            email: 'admin@demo.com',
            password: 'admin123456',
            userRole: 'admin',
            profileData: {
                nickname: '演示管理员',
                department: '系统管理部'
            }
        }, 'super_admin');

        if (adminResult.success) {
            console.log('✅ 管理员用户注册成功');
            
            // 管理员登录
            const adminLogin = this.api.loginWithPermissions({
                username: 'demo_admin',
                password: 'admin123456'
            });
            
            if (adminLogin.success) {
                this.adminToken = adminLogin.data.sessionToken;
                console.log('✅ 管理员登录成功');
                console.log(`   权限数量: ${adminLogin.data.permissions.length}`);
                console.log(`   角色数量: ${adminLogin.data.roles.length}`);
            }
        }

        // 注册普通用户
        const userResult = this.api.registerWithRole({
            username: 'demo_user',
            email: 'user@demo.com',
            password: 'user123456',
            profileData: {
                nickname: '演示用户',
                department: '业务部门'
            }
        }, 'user');

        if (userResult.success) {
            console.log('✅ 普通用户注册成功');
            
            // 普通用户登录
            const userLogin = this.api.loginWithPermissions({
                username: 'demo_user',
                password: 'user123456'
            });
            
            if (userLogin.success) {
                this.userToken = userLogin.data.sessionToken;
                console.log('✅ 普通用户登录成功');
                console.log(`   权限数量: ${userLogin.data.permissions.length}`);
                console.log(`   角色数量: ${userLogin.data.roles.length}`);
            }
        }
    }

    // 演示角色和权限管理
    async demonstrateRoleManagement() {
        console.log('\n👑 2. 角色和权限管理演示');
        console.log('-'.repeat(40));

        // 创建自定义角色
        const editorRole = this.api.createRole({
            name: '内容编辑者',
            code: 'content_editor',
            description: '负责内容编辑和审核的角色',
            level: 40
        }, this.adminToken);

        if (editorRole.success) {
            console.log('✅ 创建编辑者角色成功');
            
            // 获取一些权限来分配给编辑者
            const permissions = this.api.getPermissions(this.adminToken, 1, 20);
            if (permissions.success) {
                const editorPermissions = permissions.data.permissions
                    .filter(p => ['user.view', 'user.edit', 'role.view'].includes(p.code))
                    .map(p => p.id);
                
                // 为编辑者角色分配权限
                const assignResult = this.api.assignRolePermissions(
                    editorRole.data.roleId,
                    editorPermissions,
                    this.adminToken
                );
                
                if (assignResult.success) {
                    console.log('✅ 为编辑者角色分配权限成功');
                    console.log(`   分配权限数量: ${editorPermissions.length}`);
                }
            }
        }

        // 显示所有角色
        const roles = this.api.getRoles(this.adminToken, 1, 10);
        if (roles.success) {
            console.log('\n📋 当前系统角色:');
            roles.data.roles.forEach(role => {
                console.log(`   - ${role.name} (${role.code}) - 级别: ${role.level} - 用户数: ${role.userCount}`);
            });
        }
    }

    // 演示用户权限分配
    async demonstrateUserPermissions() {
        console.log('\n👤 3. 用户权限分配演示');
        console.log('-'.repeat(40));

        // 注册编辑者用户
        const editorResult = this.api.register({
            username: 'demo_editor',
            email: 'editor@demo.com',
            password: 'editor123456',
            profileData: {
                nickname: '演示编辑者',
                department: '内容部门'
            }
        });

        if (editorResult.success) {
            console.log('✅ 编辑者用户注册成功');
            
            // 为编辑者分配角色
            const roles = this.api.getRoles(this.adminToken, 1, 20);
            if (roles.success) {
                const editorRole = roles.data.roles.find(r => r.code === 'content_editor');
                if (editorRole) {
                    const assignResult = this.api.assignUserRoles(
                        editorResult.data.userId,
                        [editorRole.id],
                        this.adminToken
                    );
                    
                    if (assignResult.success) {
                        console.log('✅ 为编辑者分配角色成功');
                    }
                }
            }
            
            // 编辑者登录
            const editorLogin = this.api.loginWithPermissions({
                username: 'demo_editor',
                password: 'editor123456'
            });
            
            if (editorLogin.success) {
                this.editorToken = editorLogin.data.sessionToken;
                console.log('✅ 编辑者登录成功');
                console.log(`   权限数量: ${editorLogin.data.permissions.length}`);
                
                // 显示编辑者的权限
                console.log('   拥有的权限:');
                editorLogin.data.permissions.forEach(perm => {
                    console.log(`     - ${perm.name} (${perm.code})`);
                });
            }
        }

        // 为用户分配特殊权限
        const permissions = this.api.getPermissions(this.adminToken, 1, 20);
        if (permissions.success) {
            const specialPermission = permissions.data.permissions.find(p => p.code === 'system.view_logs');
            if (specialPermission) {
                const assignResult = this.api.assignUserPermission(
                    editorResult.data.userId,
                    specialPermission.id,
                    'grant',
                    this.adminToken,
                    null,
                    '临时授予日志查看权限'
                );
                
                if (assignResult.success) {
                    console.log('✅ 为编辑者分配特殊权限成功');
                }
            }
        }
    }

    // 演示权限检查
    async demonstratePermissionChecking() {
        console.log('\n🔍 4. 权限检查演示');
        console.log('-'.repeat(40));

        const testPermissions = [
            'user.view',
            'user.edit', 
            'user.delete',
            'role.create',
            'system.config',
            'system.view_logs'
        ];

        const users = [
            { name: '管理员', token: this.adminToken },
            { name: '编辑者', token: this.editorToken },
            { name: '普通用户', token: this.userToken }
        ];

        console.log('权限检查矩阵:');
        console.log('用户\\权限\t' + testPermissions.map(p => p.split('.')[1]).join('\t'));
        console.log('-'.repeat(80));

        for (const user of users) {
            if (!user.token) continue;
            
            let row = user.name + '\t\t';
            for (const permission of testPermissions) {
                const hasPermission = this.api.checkPermission(user.token, permission);
                const symbol = hasPermission.hasPermission ? '✅' : '❌';
                row += symbol + '\t';
            }
            console.log(row);
        }
    }

    // 演示权限冲突处理
    async demonstratePermissionConflicts() {
        console.log('\n⚡ 5. 权限冲突处理演示');
        console.log('-'.repeat(40));

        if (!this.editorToken) return;

        // 检查编辑者当前是否有用户删除权限
        const beforeCheck = this.api.checkPermission(this.editorToken, 'user.delete');
        console.log(`编辑者删除权限 (分配前): ${beforeCheck.hasPermission ? '✅ 有' : '❌ 无'}`);

        // 通过角色给编辑者用户删除权限
        const permissions = this.api.getPermissions(this.adminToken, 1, 20);
        if (permissions.success) {
            const deletePermission = permissions.data.permissions.find(p => p.code === 'user.delete');
            const roles = this.api.getRoles(this.adminToken, 1, 20);
            
            if (deletePermission && roles.success) {
                const editorRole = roles.data.roles.find(r => r.code === 'content_editor');
                if (editorRole) {
                    // 获取当前角色权限
                    const currentPerms = this.api.getRolePermissions(editorRole.id, this.adminToken);
                    if (currentPerms.success) {
                        const newPermissions = [...currentPerms.data.permissions.map(p => p.id), deletePermission.id];
                        
                        // 重新分配权限（包含删除权限）
                        const assignResult = this.api.assignRolePermissions(
                            editorRole.id,
                            newPermissions,
                            this.adminToken
                        );
                        
                        if (assignResult.success) {
                            console.log('✅ 通过角色授予编辑者删除权限');
                            
                            // 重新登录以刷新权限
                            const refreshLogin = this.api.loginWithPermissions({
                                username: 'demo_editor',
                                password: 'editor123456'
                            });
                            
                            if (refreshLogin.success) {
                                this.editorToken = refreshLogin.data.sessionToken;
                                
                                const afterRoleCheck = this.api.checkPermission(this.editorToken, 'user.delete');
                                console.log(`编辑者删除权限 (角色授权后): ${afterRoleCheck.hasPermission ? '✅ 有' : '❌ 无'}`);
                                
                                // 现在通过直接权限拒绝这个权限
                                const denyResult = this.api.assignUserPermission(
                                    refreshLogin.data.userId,
                                    deletePermission.id,
                                    'deny',
                                    this.adminToken,
                                    null,
                                    '安全考虑，拒绝删除权限'
                                );
                                
                                if (denyResult.success) {
                                    console.log('✅ 通过直接权限拒绝编辑者删除权限');
                                    
                                    // 再次检查权限（应该被拒绝）
                                    const finalCheck = this.api.checkPermission(this.editorToken, 'user.delete');
                                    console.log(`编辑者删除权限 (直接拒绝后): ${finalCheck.hasPermission ? '✅ 有' : '❌ 无'}`);
                                    console.log('💡 演示了权限冲突处理：直接拒绝优先于角色授权');
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 演示权限日志
    async demonstratePermissionLogs() {
        console.log('\n📝 6. 权限操作日志演示');
        console.log('-'.repeat(40));

        // 获取最近的权限操作日志
        const logs = this.api.getPermissionLogs(this.adminToken, 1, 10);
        if (logs.success) {
            console.log('最近的权限操作记录:');
            logs.data.logs.forEach((log, index) => {
                const details = JSON.parse(log.details || '{}');
                console.log(`${index + 1}. ${log.createdAt}`);
                console.log(`   操作: ${log.action}`);
                console.log(`   操作者: ${log.operatorId || '系统'}`);
                console.log(`   目标: ${log.targetType} #${log.targetId}`);
                if (details.name) console.log(`   名称: ${details.name}`);
                if (details.reason) console.log(`   原因: ${details.reason}`);
                console.log('');
            });
        }

        // 显示统计信息
        console.log('权限系统统计:');
        const allRoles = this.api.getRoles(this.adminToken, 1, 100);
        const allPermissions = this.api.getPermissions(this.adminToken, 1, 100);
        
        if (allRoles.success && allPermissions.success) {
            console.log(`   总角色数: ${allRoles.data.roles.length}`);
            console.log(`   总权限数: ${allPermissions.data.permissions.length}`);
            
            const modules = {};
            allPermissions.data.permissions.forEach(perm => {
                if (!modules[perm.module]) modules[perm.module] = 0;
                modules[perm.module]++;
            });
            
            console.log('   权限模块分布:');
            Object.entries(modules).forEach(([module, count]) => {
                console.log(`     - ${module}: ${count}个权限`);
            });
        }
    }

    // 演示API权限保护
    async demonstrateAPIProtection() {
        console.log('\n🛡️ 7. API权限保护演示');
        console.log('-'.repeat(40));

        // 尝试用普通用户调用需要管理员权限的API
        console.log('普通用户尝试获取用户列表:');
        const userListResult = this.api.getUserList(this.userToken, 1, 5);
        console.log(`结果: ${userListResult.success ? '✅ 成功' : '❌ ' + userListResult.message}`);

        console.log('\n管理员获取用户列表:');
        const adminUserListResult = this.api.getUserList(this.adminToken, 1, 5);
        console.log(`结果: ${adminUserListResult.success ? '✅ 成功' : '❌ ' + adminUserListResult.message}`);
        if (adminUserListResult.success) {
            console.log(`   用户数量: ${adminUserListResult.data.users.length}`);
        }

        // 尝试用编辑者创建角色
        console.log('\n编辑者尝试创建角色:');
        const createRoleResult = this.api.createRole({
            name: '测试角色',
            code: 'test_role_by_editor',
            description: '编辑者创建的测试角色'
        }, this.editorToken);
        console.log(`结果: ${createRoleResult.success ? '✅ 成功' : '❌ ' + createRoleResult.message}`);
    }
}

// 运行演示
const demo = new PermissionDemo();
demo.runDemo().then(() => {
    console.log('\n🔚 演示结束');
}).catch(error => {
    console.error('演示失败:', error);
});

export default PermissionDemo;