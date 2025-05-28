import permissionManager from './permission-manager.mjs';

// 权限管理测试类
class PermissionManagerTest {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.totalTests = 0;
    }

    // 运行测试
    runTest(testName, testFunction) {
        this.totalTests++;
        try {
            const result = testFunction();
            if (result) {
                this.passedTests++;
                this.testResults.push({ name: testName, status: 'PASS', message: '测试通过' });
                console.log(`✅ ${testName} - 通过`);
            } else {
                this.testResults.push({ name: testName, status: 'FAIL', message: '测试失败' });
                console.log(`❌ ${testName} - 失败`);
            }
        } catch (error) {
            this.testResults.push({ name: testName, status: 'ERROR', message: error.message });
            console.log(`💥 ${testName} - 错误: ${error.message}`);
        }
    }

    // 打印测试结果
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 权限管理系统测试结果');
        console.log('='.repeat(60));
        console.log(`总测试数: ${this.totalTests}`);
        console.log(`通过数: ${this.passedTests}`);
        console.log(`失败数: ${this.totalTests - this.passedTests}`);
        console.log(`成功率: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));
    }

    // 运行所有测试
    runAllTests() {
        console.log('🚀 开始权限管理系统测试\n');

        // 权限管理测试
        this.testPermissionManagement();
        
        // 角色管理测试
        this.testRoleManagement();
        
        // 用户权限测试
        this.testUserPermissions();
        
        // 权限检查测试
        this.testPermissionChecking();
        
        // 日志测试
        this.testPermissionLogs();

        this.printResults();
    }

    // 权限管理测试
    testPermissionManagement() {
        console.log('\n📋 权限管理测试');
        console.log('-'.repeat(40));

        // 测试创建权限
        this.runTest('创建自定义权限', () => {
            const result = permissionManager.createPermission({
                name: '测试权限',
                code: 'test.permission',
                description: '这是一个测试权限',
                module: 'test',
                action: 'permission'
            }, 1);
            return result.success && result.data.permissionId;
        });

        // 测试权限代码重复
        this.runTest('权限代码重复检查', () => {
            const result = permissionManager.createPermission({
                name: '重复权限',
                code: 'test.permission', // 重复的代码
                description: '重复权限测试',
                module: 'test',
                action: 'duplicate'
            }, 1);
            return !result.success && result.message.includes('已存在');
        });

        // 测试获取权限列表
        this.runTest('获取权限列表', () => {
            const result = permissionManager.getPermissions(1, 10);
            return result.success && Array.isArray(result.data.permissions);
        });

        // 测试更新权限
        this.runTest('更新权限信息', () => {
            const result = permissionManager.updatePermission(1, {
                name: '更新后的权限名称',
                description: '更新后的描述'
            }, 1);
            return result.success;
        });

        // 测试权限搜索
        this.runTest('权限搜索功能', () => {
            const result = permissionManager.getPermissions(1, 10, {
                search: '用户',
                module: 'user'
            });
            return result.success && result.data.permissions.length > 0;
        });
    }

    // 角色管理测试
    testRoleManagement() {
        console.log('\n👑 角色管理测试');
        console.log('-'.repeat(40));

        // 测试创建角色
        this.runTest('创建自定义角色', () => {
            const result = permissionManager.createRole({
                name: '测试角色',
                code: 'test_role',
                description: '这是一个测试角色',
                level: 50
            }, 1);
            return result.success && result.data.roleId;
        });

        // 测试角色代码重复
        this.runTest('角色代码重复检查', () => {
            const result = permissionManager.createRole({
                name: '重复角色',
                code: 'test_role', // 重复的代码
                description: '重复角色测试',
                level: 30
            }, 1);
            return !result.success && result.message.includes('已存在');
        });

        // 测试获取角色列表
        this.runTest('获取角色列表', () => {
            const result = permissionManager.getRoles(1, 10);
            return result.success && Array.isArray(result.data.roles);
        });

        // 测试为角色分配权限
        this.runTest('为角色分配权限', () => {
            // 获取一些权限ID
            const permissions = permissionManager.getPermissions(1, 5);
            if (!permissions.success) return false;
            
            const permissionIds = permissions.data.permissions.slice(0, 3).map(p => p.id);
            const result = permissionManager.assignPermissionsToRole(1, permissionIds, 1);
            return result.success;
        });

        // 测试获取角色权限
        this.runTest('获取角色权限', () => {
            const result = permissionManager.getRolePermissions(1);
            return result.success && Array.isArray(result.data.permissions);
        });

        // 测试更新角色
        this.runTest('更新角色信息', () => {
            const result = permissionManager.updateRole(1, {
                name: '更新后的角色名称',
                description: '更新后的角色描述',
                level: 90
            }, 1);
            return result.success;
        });

        // 测试系统角色保护
        this.runTest('系统角色保护机制', () => {
            const result = permissionManager.deleteRole(1, 1); // 尝试删除系统角色
            return !result.success && result.message.includes('系统角色');
        });
    }

    // 用户权限测试
    testUserPermissions() {
        console.log('\n👤 用户权限测试');
        console.log('-'.repeat(40));

        // 测试为用户分配角色
        this.runTest('为用户分配角色', () => {
            const result = permissionManager.assignRolesToUser(1, [1, 2], 1);
            return result.success;
        });

        // 测试获取用户角色
        this.runTest('获取用户角色', () => {
            const result = permissionManager.getUserRoles(1);
            return result.success && Array.isArray(result.data.roles);
        });

        // 测试获取用户权限
        this.runTest('获取用户权限', () => {
            const result = permissionManager.getUserPermissions(1);
            return result.success && Array.isArray(result.data.permissions);
        });

        // 测试为用户分配直接权限
        this.runTest('为用户分配直接权限', () => {
            const result = permissionManager.assignPermissionToUser(1, 1, 'grant', 1, null, '测试直接权限分配');
            return result.success;
        });

        // 测试权限拒绝
        this.runTest('权限拒绝功能', () => {
            const result = permissionManager.assignPermissionToUser(1, 2, 'deny', 1, null, '测试权限拒绝');
            return result.success;
        });

        // 测试权限冲突处理
        this.runTest('权限冲突处理', () => {
            // 先给用户一个权限（通过角色）
            permissionManager.assignRolesToUser(2, [2], 1); // 分配一个有权限的角色
            
            // 再拒绝这个权限
            permissionManager.assignPermissionToUser(2, 1, 'deny', 1, null, '测试冲突');
            
            // 检查最终权限（应该被拒绝）
            const userPermissions = permissionManager.getUserPermissions(2);
            const hasPermission = userPermissions.data.permissions.some(p => p.id === 1);
            
            return !hasPermission; // 权限应该被拒绝
        });
    }

    // 权限检查测试
    testPermissionChecking() {
        console.log('\n🔍 权限检查测试');
        console.log('-'.repeat(40));

        // 测试权限检查功能
        this.runTest('检查用户权限', () => {
            const result = permissionManager.hasPermission(1, 'user.view');
            return result.success && typeof result.hasPermission === 'boolean';
        });

        // 测试不存在的权限
        this.runTest('检查不存在的权限', () => {
            const result = permissionManager.hasPermission(1, 'nonexistent.permission');
            return result.success && !result.hasPermission;
        });

        // 测试超级管理员权限
        this.runTest('超级管理员权限检查', () => {
            // 为用户分配超级管理员角色
            permissionManager.assignRolesToUser(3, [1], 1); // 角色ID 1 应该是超级管理员
            
            const result = permissionManager.hasPermission(3, 'system.config');
            return result.success && result.hasPermission;
        });

        // 测试普通用户权限限制
        this.runTest('普通用户权限限制', () => {
            // 为用户分配普通用户角色
            permissionManager.assignRolesToUser(4, [4], 1); // 角色ID 4 应该是普通用户
            
            const result = permissionManager.hasPermission(4, 'user.delete');
            return result.success && !result.hasPermission;
        });
    }

    // 日志测试
    testPermissionLogs() {
        console.log('\n📝 权限日志测试');
        console.log('-'.repeat(40));

        // 测试获取权限日志
        this.runTest('获取权限操作日志', () => {
            const result = permissionManager.getPermissionLogs(1, 10);
            return result.success && Array.isArray(result.data.logs);
        });

        // 测试日志过滤
        this.runTest('权限日志过滤', () => {
            const result = permissionManager.getPermissionLogs(1, 10, {
                action: 'create_permission',
                targetType: 'permission'
            });
            return result.success;
        });

        // 测试用户操作日志
        this.runTest('用户操作日志', () => {
            const result = permissionManager.getPermissionLogs(1, 10, {
                userId: 1
            });
            return result.success;
        });
    }

    // 演示权限系统功能
    demonstratePermissionSystem() {
        console.log('\n🎯 权限系统功能演示');
        console.log('='.repeat(60));

        // 1. 显示默认角色和权限
        console.log('\n1. 默认角色列表:');
        const roles = permissionManager.getRoles(1, 20);
        if (roles.success) {
            roles.data.roles.forEach(role => {
                console.log(`   - ${role.name} (${role.code}) - 级别: ${role.level} - 用户数: ${role.userCount} - 权限数: ${role.permissionCount}`);
            });
        }

        // 2. 显示权限模块
        console.log('\n2. 权限模块分布:');
        const permissions = permissionManager.getPermissions(1, 100);
        if (permissions.success) {
            const modules = {};
            permissions.data.permissions.forEach(perm => {
                if (!modules[perm.module]) modules[perm.module] = 0;
                modules[perm.module]++;
            });
            Object.entries(modules).forEach(([module, count]) => {
                console.log(`   - ${module}: ${count}个权限`);
            });
        }

        // 3. 创建示例用户权限场景
        console.log('\n3. 创建示例权限场景:');
        
        // 创建一个编辑者角色
        const editorRole = permissionManager.createRole({
            name: '内容编辑者',
            code: 'content_editor',
            description: '负责内容编辑的角色',
            level: 40
        }, 1);

        if (editorRole.success) {
            console.log(`   ✅ 创建编辑者角色成功 (ID: ${editorRole.data.roleId})`);
            
            // 为编辑者分配特定权限
            const editorPermissions = permissions.data.permissions
                .filter(p => ['user.view', 'user.edit'].includes(p.code))
                .map(p => p.id);
            
            const assignResult = permissionManager.assignPermissionsToRole(
                editorRole.data.roleId, 
                editorPermissions, 
                1
            );
            
            if (assignResult.success) {
                console.log('   ✅ 为编辑者角色分配权限成功');
            }
        }

        // 4. 演示用户权限分配
        console.log('\n4. 用户权限分配演示:');
        
        // 为用户5分配编辑者角色
        if (editorRole.success) {
            const userRoleAssign = permissionManager.assignRolesToUser(5, [editorRole.data.roleId], 1);
            if (userRoleAssign.success) {
                console.log('   ✅ 为用户5分配编辑者角色成功');
                
                // 检查用户权限
                const userPerms = permissionManager.getUserPermissions(5);
                if (userPerms.success) {
                    console.log(`   📋 用户5拥有 ${userPerms.data.permissions.length} 个权限:`);
                    userPerms.data.permissions.forEach(perm => {
                        console.log(`      - ${perm.name} (${perm.code})`);
                    });
                }
            }
        }

        // 5. 演示权限检查
        console.log('\n5. 权限检查演示:');
        const checkPermissions = ['user.view', 'user.edit', 'user.delete', 'system.config'];
        checkPermissions.forEach(permCode => {
            const hasPermission = permissionManager.hasPermission(5, permCode);
            const status = hasPermission.hasPermission ? '✅ 有权限' : '❌ 无权限';
            console.log(`   ${permCode}: ${status}`);
        });

        // 6. 显示最近的权限操作日志
        console.log('\n6. 最近的权限操作日志:');
        const logs = permissionManager.getPermissionLogs(1, 5);
        if (logs.success) {
            logs.data.logs.forEach(log => {
                const details = JSON.parse(log.details || '{}');
                console.log(`   - ${log.createdAt}: ${log.action} (操作者: ${log.operatorId})`);
                if (details.name) console.log(`     名称: ${details.name}`);
            });
        }

        console.log('\n🎉 权限系统演示完成！');
    }
}

// 运行测试
const tester = new PermissionManagerTest();
tester.runAllTests();

// 运行演示
tester.demonstratePermissionSystem();

export default PermissionManagerTest;