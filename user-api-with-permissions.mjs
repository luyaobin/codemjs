import userAPI from './app.mjs';
import permissionManager from './permission-manager.mjs';

// 扩展用户API，集成权限管理
class UserAPIWithPermissions {
    constructor() {
        this.userAPI = userAPI;
        this.permissionManager = permissionManager;
    }

    // 权限检查装饰器
    requirePermission(permissionCode) {
        return (target, propertyName, descriptor) => {
            const method = descriptor.value;
            descriptor.value = function(...args) {
                // 从参数中提取sessionToken或userId
                const sessionToken = args.find(arg => typeof arg === 'string' && arg.includes('_'));
                if (sessionToken) {
                    const sessionResult = this.userAPI.validateSession(sessionToken);
                    if (!sessionResult.success) {
                        return { success: false, message: '会话无效' };
                    }
                    
                    const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, permissionCode);
                    if (!hasPermission.hasPermission) {
                        return { success: false, message: `权限不足，需要权限: ${permissionCode}` };
                    }
                }
                
                return method.apply(this, args);
            };
            return descriptor;
        };
    }

    // 检查用户权限
    checkUserPermission(sessionToken, permissionCode) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效', hasPermission: false };
            }

            // 检查权限
            const permissionResult = this.permissionManager.hasPermission(sessionResult.data.userId, permissionCode);
            
            return {
                success: true,
                hasPermission: permissionResult.hasPermission,
                message: permissionResult.message,
                data: {
                    userId: sessionResult.data.userId,
                    username: sessionResult.data.username,
                    permissionCode,
                    hasPermission: permissionResult.hasPermission
                }
            };
        } catch (error) {
            return { success: false, message: '权限检查失败: ' + error.message, hasPermission: false };
        }
    }

    // 获取用户的所有权限
    getUserPermissions(sessionToken) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效' };
            }

            // 获取用户权限
            const permissionsResult = this.permissionManager.getUserPermissions(sessionResult.data.userId);
            if (!permissionsResult.success) {
                return permissionsResult;
            }

            // 获取用户角色
            const rolesResult = this.permissionManager.getUserRoles(sessionResult.data.userId);

            return {
                success: true,
                message: '获取用户权限成功',
                data: {
                    userId: sessionResult.data.userId,
                    username: sessionResult.data.username,
                    permissions: permissionsResult.data.permissions,
                    rolePermissions: permissionsResult.data.rolePermissions,
                    directPermissions: permissionsResult.data.directPermissions,
                    roles: rolesResult.success ? rolesResult.data.roles : []
                }
            };
        } catch (error) {
            return { success: false, message: '获取用户权限失败: ' + error.message };
        }
    }

    // 为用户分配角色（需要管理员权限）
    assignUserRoles(userId, roleIds, operatorSessionToken) {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'role.assign');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要角色分配权限' };
            }

            // 分配角色
            const result = this.permissionManager.assignRolesToUser(userId, roleIds, sessionResult.data.userId);
            
            if (result.success) {
                // 记录到用户操作日志
                this.userAPI.logUserAction(userId, 'assign_roles', {
                    roleIds,
                    operatorId: sessionResult.data.userId
                });
            }

            return result;
        } catch (error) {
            return { success: false, message: '分配角色失败: ' + error.message };
        }
    }

    // 为用户分配直接权限（需要权限管理权限）
    assignUserPermission(userId, permissionId, type, operatorSessionToken, expiresAt = null, reason = '') {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'permission.assign');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要权限分配权限' };
            }

            // 分配权限
            const result = this.permissionManager.assignPermissionToUser(
                userId, 
                permissionId, 
                type, 
                sessionResult.data.userId, 
                expiresAt, 
                reason
            );

            if (result.success) {
                // 记录到用户操作日志
                this.userAPI.logUserAction(userId, 'assign_permission', {
                    permissionId,
                    type,
                    reason,
                    operatorId: sessionResult.data.userId
                });
            }

            return result;
        } catch (error) {
            return { success: false, message: '分配权限失败: ' + error.message };
        }
    }

    // 创建角色（需要角色管理权限）
    createRole(roleData, operatorSessionToken) {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'role.create');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要角色创建权限' };
            }

            // 创建角色
            return this.permissionManager.createRole(roleData, sessionResult.data.userId);
        } catch (error) {
            return { success: false, message: '创建角色失败: ' + error.message };
        }
    }

    // 更新角色（需要角色管理权限）
    updateRole(roleId, updateData, operatorSessionToken) {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'role.edit');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要角色编辑权限' };
            }

            // 更新角色
            return this.permissionManager.updateRole(roleId, updateData, sessionResult.data.userId);
        } catch (error) {
            return { success: false, message: '更新角色失败: ' + error.message };
        }
    }

    // 删除角色（需要角色管理权限）
    deleteRole(roleId, operatorSessionToken) {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'role.delete');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要角色删除权限' };
            }

            // 删除角色
            return this.permissionManager.deleteRole(roleId, sessionResult.data.userId);
        } catch (error) {
            return { success: false, message: '删除角色失败: ' + error.message };
        }
    }

    // 获取角色列表（需要角色查看权限）
    getRoles(sessionToken, page = 1, pageSize = 20, filters = {}) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效' };
            }

            // 检查权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'role.view');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要角色查看权限' };
            }

            // 获取角色列表
            return this.permissionManager.getRoles(page, pageSize, filters);
        } catch (error) {
            return { success: false, message: '获取角色列表失败: ' + error.message };
        }
    }

    // 获取权限列表（需要权限查看权限）
    getPermissions(sessionToken, page = 1, pageSize = 20, filters = {}) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效' };
            }

            // 检查权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'permission.view');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要权限查看权限' };
            }

            // 获取权限列表
            return this.permissionManager.getPermissions(page, pageSize, filters);
        } catch (error) {
            return { success: false, message: '获取权限列表失败: ' + error.message };
        }
    }

    // 为角色分配权限（需要权限管理权限）
    assignRolePermissions(roleId, permissionIds, operatorSessionToken) {
        try {
            // 验证操作者会话
            const sessionResult = this.userAPI.validateSession(operatorSessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '操作者会话无效' };
            }

            // 检查操作者权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'permission.assign');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要权限分配权限' };
            }

            // 分配权限
            return this.permissionManager.assignPermissionsToRole(roleId, permissionIds, sessionResult.data.userId);
        } catch (error) {
            return { success: false, message: '分配角色权限失败: ' + error.message };
        }
    }

    // 获取角色权限（需要权限查看权限）
    getRolePermissions(roleId, sessionToken) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效' };
            }

            // 检查权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'permission.view');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要权限查看权限' };
            }

            // 获取角色权限
            return this.permissionManager.getRolePermissions(roleId);
        } catch (error) {
            return { success: false, message: '获取角色权限失败: ' + error.message };
        }
    }

    // 获取权限操作日志（需要日志查看权限）
    getPermissionLogs(sessionToken, page = 1, pageSize = 20, filters = {}) {
        try {
            // 验证会话
            const sessionResult = this.userAPI.validateSession(sessionToken);
            if (!sessionResult.success) {
                return { success: false, message: '会话无效' };
            }

            // 检查权限
            const hasPermission = this.permissionManager.hasPermission(sessionResult.data.userId, 'system.view_logs');
            if (!hasPermission.hasPermission) {
                return { success: false, message: '权限不足，需要日志查看权限' };
            }

            // 获取权限日志
            return this.permissionManager.getPermissionLogs(page, pageSize, filters);
        } catch (error) {
            return { success: false, message: '获取权限日志失败: ' + error.message };
        }
    }

    // 扩展用户注册，自动分配默认角色
    registerWithRole(userData, defaultRole = 'user') {
        try {
            // 调用原始注册方法
            const registerResult = this.userAPI.register(userData);
            if (!registerResult.success) {
                return registerResult;
            }

            // 获取默认角色
            const roles = this.permissionManager.getRoles(1, 100, { search: defaultRole });
            if (roles.success && roles.data.roles.length > 0) {
                const defaultRoleObj = roles.data.roles.find(r => r.code === defaultRole);
                if (defaultRoleObj) {
                    // 分配默认角色
                    this.permissionManager.assignRolesToUser(
                        registerResult.data.userId, 
                        [defaultRoleObj.id], 
                        null // 系统自动分配
                    );
                }
            }

            return registerResult;
        } catch (error) {
            return { success: false, message: '注册失败: ' + error.message };
        }
    }

    // 扩展用户登录，返回权限信息
    loginWithPermissions(credentials) {
        try {
            // 调用原始登录方法
            const loginResult = this.userAPI.login(credentials);
            if (!loginResult.success) {
                return loginResult;
            }

            // 获取用户权限信息
            const permissionsResult = this.permissionManager.getUserPermissions(loginResult.data.userId);
            const rolesResult = this.permissionManager.getUserRoles(loginResult.data.userId);

            // 扩展登录结果
            loginResult.data.permissions = permissionsResult.success ? permissionsResult.data.permissions : [];
            loginResult.data.roles = rolesResult.success ? rolesResult.data.roles : [];

            return loginResult;
        } catch (error) {
            return { success: false, message: '登录失败: ' + error.message };
        }
    }

    // 权限中间件 - 检查API调用权限
    withPermissionCheck(permissionCode, apiMethod) {
        return (sessionToken, ...args) => {
            // 检查权限
            const permissionCheck = this.checkUserPermission(sessionToken, permissionCode);
            if (!permissionCheck.success || !permissionCheck.hasPermission) {
                return { 
                    success: false, 
                    message: `权限不足，需要权限: ${permissionCode}` 
                };
            }

            // 执行原始API方法
            return apiMethod.call(this.userAPI, sessionToken, ...args);
        };
    }

    // 获取用户管理权限包装的API
    getProtectedUserAPI() {
        return {
            // 基础功能（无需特殊权限）
            register: this.userAPI.register.bind(this.userAPI),
            login: this.userAPI.login.bind(this.userAPI),
            validateSession: this.userAPI.validateSession.bind(this.userAPI),
            logout: this.userAPI.logout.bind(this.userAPI),

            // 需要权限的功能
            getUserList: this.withPermissionCheck('user.view', this.userAPI.getUserList),
            updateUser: this.withPermissionCheck('user.edit', this.userAPI.updateUser),
            deleteUser: this.withPermissionCheck('user.delete', this.userAPI.deleteUser),
            getLogs: this.withPermissionCheck('system.view_logs', this.userAPI.getLogs),

            // 权限管理功能
            checkPermission: this.checkUserPermission.bind(this),
            getUserPermissions: this.getUserPermissions.bind(this),
            assignUserRoles: this.assignUserRoles.bind(this),
            assignUserPermission: this.assignUserPermission.bind(this),
            
            // 角色管理功能
            createRole: this.createRole.bind(this),
            updateRole: this.updateRole.bind(this),
            deleteRole: this.deleteRole.bind(this),
            getRoles: this.getRoles.bind(this),
            assignRolePermissions: this.assignRolePermissions.bind(this),
            getRolePermissions: this.getRolePermissions.bind(this),
            
            // 权限管理功能
            getPermissions: this.getPermissions.bind(this),
            getPermissionLogs: this.getPermissionLogs.bind(this),

            // 扩展功能
            registerWithRole: this.registerWithRole.bind(this),
            loginWithPermissions: this.loginWithPermissions.bind(this)
        };
    }
}

// 创建集成权限管理的用户API实例
const userAPIWithPermissions = new UserAPIWithPermissions();

export default userAPIWithPermissions;