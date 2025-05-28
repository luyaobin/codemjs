import { QLocalStorage, QSettings } from 'qmlnode';

// 权限管理类
class PermissionManager {
    constructor() {
        this.dbName = 'permission_management_db';
        this.db = null;
        this.settings = null;
        this.init();
    }

    // 初始化数据库和设置
    init() {
        try {
            // 初始化设置
            this.settings = QSettings.open('permission_config', {
                enablePermissionLogging: true,
                defaultUserRole: 'user',
                maxRoleLevel: 100
            });

            // 初始化数据库
            this.db = QLocalStorage.openDatabaseSync(this.dbName, '1.0', '权限管理数据库', 1000000);
            
            if (!this.db) {
                throw new Error('无法打开权限管理数据库');
            }

            // 创建数据库表
            this.initializeDatabase();
            
            // 初始化默认数据
            this.initializeDefaultData();
            
            console.log('权限管理系统初始化成功');
            
        } catch (error) {
            console.error('权限管理系统初始化失败:', error);
            throw error;
        }
    }

    // 初始化数据库表
    initializeDatabase() {
        this.db.transaction(tx => {
            // 权限表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    description TEXT,
                    module TEXT NOT NULL,
                    action TEXT NOT NULL,
                    resource TEXT,
                    isActive BOOLEAN DEFAULT 1,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);

            // 角色表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS roles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    description TEXT,
                    level INTEGER DEFAULT 0,
                    isActive BOOLEAN DEFAULT 1,
                    isSystem BOOLEAN DEFAULT 0,
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `);

            // 角色权限关联表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS role_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    roleId INTEGER NOT NULL,
                    permissionId INTEGER NOT NULL,
                    grantedBy INTEGER,
                    grantedAt TEXT NOT NULL,
                    UNIQUE(roleId, permissionId)
                )
            `);

            // 用户角色关联表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS user_roles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    roleId INTEGER NOT NULL,
                    assignedBy INTEGER,
                    assignedAt TEXT NOT NULL,
                    expiresAt TEXT,
                    isActive BOOLEAN DEFAULT 1,
                    UNIQUE(userId, roleId)
                )
            `);

            // 用户直接权限表（特殊权限分配）
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS user_permissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER NOT NULL,
                    permissionId INTEGER NOT NULL,
                    type TEXT NOT NULL CHECK(type IN ('grant', 'deny')),
                    assignedBy INTEGER,
                    assignedAt TEXT NOT NULL,
                    expiresAt TEXT,
                    reason TEXT,
                    UNIQUE(userId, permissionId)
                )
            `);

            // 权限操作日志表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS permission_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId INTEGER,
                    operatorId INTEGER,
                    action TEXT NOT NULL,
                    targetType TEXT NOT NULL,
                    targetId INTEGER,
                    details TEXT,
                    ipAddress TEXT,
                    userAgent TEXT,
                    createdAt TEXT NOT NULL
                )
            `);

            console.log('权限管理数据库表创建完成');
        });
    }

    // 初始化默认数据
    initializeDefaultData() {
        // 检查是否已初始化
        let existingRoles = 0;
        this.db.transaction(tx => {
            const result = tx.executeSql("SELECT COUNT(*) as count FROM roles WHERE isSystem = 1");
            if (result.rows.length > 0) {
                existingRoles = result.rows.item(0).count;
            }
        });

        if (existingRoles > 0) {
            return; // 已初始化
        }

        const now = this.getCurrentTimeISO();

        // 创建默认权限
        const defaultPermissions = [
            // 用户管理权限
            { name: '查看用户', code: 'user.view', description: '查看用户信息', module: 'user', action: 'view' },
            { name: '创建用户', code: 'user.create', description: '创建新用户', module: 'user', action: 'create' },
            { name: '编辑用户', code: 'user.edit', description: '编辑用户信息', module: 'user', action: 'edit' },
            { name: '删除用户', code: 'user.delete', description: '删除用户', module: 'user', action: 'delete' },
            { name: '重置密码', code: 'user.reset_password', description: '重置用户密码', module: 'user', action: 'reset_password' },
            
            // 角色管理权限
            { name: '查看角色', code: 'role.view', description: '查看角色信息', module: 'role', action: 'view' },
            { name: '创建角色', code: 'role.create', description: '创建新角色', module: 'role', action: 'create' },
            { name: '编辑角色', code: 'role.edit', description: '编辑角色信息', module: 'role', action: 'edit' },
            { name: '删除角色', code: 'role.delete', description: '删除角色', module: 'role', action: 'delete' },
            { name: '分配角色', code: 'role.assign', description: '为用户分配角色', module: 'role', action: 'assign' },
            
            // 权限管理权限
            { name: '查看权限', code: 'permission.view', description: '查看权限信息', module: 'permission', action: 'view' },
            { name: '创建权限', code: 'permission.create', description: '创建新权限', module: 'permission', action: 'create' },
            { name: '编辑权限', code: 'permission.edit', description: '编辑权限信息', module: 'permission', action: 'edit' },
            { name: '删除权限', code: 'permission.delete', description: '删除权限', module: 'permission', action: 'delete' },
            { name: '分配权限', code: 'permission.assign', description: '为角色分配权限', module: 'permission', action: 'assign' },
            
            // 系统管理权限
            { name: '查看日志', code: 'system.view_logs', description: '查看系统日志', module: 'system', action: 'view_logs' },
            { name: '系统配置', code: 'system.config', description: '修改系统配置', module: 'system', action: 'config' },
            { name: '数据备份', code: 'system.backup', description: '备份系统数据', module: 'system', action: 'backup' },
            { name: '数据恢复', code: 'system.restore', description: '恢复系统数据', module: 'system', action: 'restore' },
        ];

        this.db.transaction(tx => {
            for (const perm of defaultPermissions) {
                tx.executeSql(`
                    INSERT INTO permissions (name, code, description, module, action, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [perm.name, perm.code, perm.description, perm.module, perm.action, now, now]);
            }

            // 创建默认角色
            const defaultRoles = [
                { name: '超级管理员', code: 'super_admin', description: '拥有所有权限的超级管理员', level: 100, isSystem: true },
                { name: '系统管理员', code: 'admin', description: '系统管理员，拥有大部分管理权限', level: 80, isSystem: true },
                { name: '用户管理员', code: 'user_admin', description: '用户管理员，负责用户相关操作', level: 60, isSystem: true },
                { name: '普通用户', code: 'user', description: '普通用户，基础权限', level: 10, isSystem: true },
                { name: 'VIP用户', code: 'vip', description: 'VIP用户，扩展权限', level: 20, isSystem: true },
                { name: '访客', code: 'guest', description: '访客用户，只读权限', level: 1, isSystem: true },
            ];

            for (const role of defaultRoles) {
                tx.executeSql(`
                    INSERT INTO roles (name, code, description, level, isSystem, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [role.name, role.code, role.description, role.level, role.isSystem, now, now]);
            }

            console.log('默认权限和角色创建完成');
        });

        // 为角色分配权限
        this.assignDefaultRolePermissions();
    }

    // 为默认角色分配权限
    assignDefaultRolePermissions() {
        const now = this.getCurrentTimeISO();

        // 获取所有权限和角色
        let permissions = [];
        let roles = [];

        this.db.transaction(tx => {
            const permResult = tx.executeSql("SELECT id, code FROM permissions");
            for (let i = 0; i < permResult.rows.length; i++) {
                permissions.push(permResult.rows.item(i));
            }

            const roleResult = tx.executeSql("SELECT id, code FROM roles WHERE isSystem = 1");
            for (let i = 0; i < roleResult.rows.length; i++) {
                roles.push(roleResult.rows.item(i));
            }
        });

        const permissionMap = {};
        permissions.forEach(p => permissionMap[p.code] = p.id);

        const roleMap = {};
        roles.forEach(r => roleMap[r.code] = r.id);

        this.db.transaction(tx => {
            // 超级管理员 - 所有权限
            const superAdminId = roleMap['super_admin'];
            permissions.forEach(perm => {
                tx.executeSql(`
                    INSERT OR IGNORE INTO role_permissions (roleId, permissionId, grantedAt)
                    VALUES (?, ?, ?)
                `, [superAdminId, perm.id, now]);
            });

            // 系统管理员 - 除了系统配置外的所有权限
            const adminId = roleMap['admin'];
            const adminPermissions = permissions.filter(p => 
                !['system.config', 'system.restore'].includes(p.code)
            );
            adminPermissions.forEach(perm => {
                tx.executeSql(`
                    INSERT OR IGNORE INTO role_permissions (roleId, permissionId, grantedAt)
                    VALUES (?, ?, ?)
                `, [adminId, perm.id, now]);
            });

            // 用户管理员 - 用户和角色相关权限
            const userAdminId = roleMap['user_admin'];
            const userAdminPermissions = permissions.filter(p => 
                ['user.view', 'user.create', 'user.edit', 'user.reset_password', 
                 'role.view', 'role.assign', 'permission.view'].includes(p.code)
            );
            userAdminPermissions.forEach(perm => {
                tx.executeSql(`
                    INSERT OR IGNORE INTO role_permissions (roleId, permissionId, grantedAt)
                    VALUES (?, ?, ?)
                `, [userAdminId, perm.id, now]);
            });

            // 普通用户 - 基础查看权限
            const userId = roleMap['user'];
            const userPermissions = permissions.filter(p => 
                ['user.view'].includes(p.code)
            );
            userPermissions.forEach(perm => {
                tx.executeSql(`
                    INSERT OR IGNORE INTO role_permissions (roleId, permissionId, grantedAt)
                    VALUES (?, ?, ?)
                `, [userId, perm.id, now]);
            });

            // VIP用户 - 扩展查看权限
            const vipId = roleMap['vip'];
            const vipPermissions = permissions.filter(p => 
                ['user.view', 'role.view', 'permission.view'].includes(p.code)
            );
            vipPermissions.forEach(perm => {
                tx.executeSql(`
                    INSERT OR IGNORE INTO role_permissions (roleId, permissionId, grantedAt)
                    VALUES (?, ?, ?)
                `, [vipId, perm.id, now]);
            });

            console.log('默认角色权限分配完成');
        });
    }

    // 获取当前时间ISO字符串
    getCurrentTimeISO() {
        return new Date().toISOString();
    }

    // 记录权限操作日志
    logPermissionAction(userId, operatorId, action, targetType, targetId, details, ipAddress = null, userAgent = null) {
        if (!this.settings.value('enablePermissionLogging')) return;

        const now = this.getCurrentTimeISO();
        this.db.transaction(tx => {
            tx.executeSql(`
                INSERT INTO permission_logs (userId, operatorId, action, targetType, targetId, details, ipAddress, userAgent, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [userId, operatorId, action, targetType, targetId, JSON.stringify(details), ipAddress, userAgent, now]);
        });
    }

    // ==================== 权限管理 ====================

    // 创建权限
    createPermission(permissionData, operatorId) {
        try {
            const { name, code, description, module, action, resource } = permissionData;

            if (!name || !code || !module || !action) {
                return { success: false, message: '权限名称、代码、模块和操作不能为空' };
            }

            // 检查权限代码是否已存在
            let existing = false;
            this.db.transaction(tx => {
                const result = tx.executeSql("SELECT id FROM permissions WHERE code = ?", [code]);
                existing = result.rows.length > 0;
            });

            if (existing) {
                return { success: false, message: '权限代码已存在' };
            }

            const now = this.getCurrentTimeISO();
            let permissionId = null;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    INSERT INTO permissions (name, code, description, module, action, resource, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [name, code, description || '', module, action, resource || '', now, now]);
                permissionId = result.insertId;
            });

            this.logPermissionAction(null, operatorId, 'create_permission', 'permission', permissionId, {
                name, code, module, action
            });

            return {
                success: true,
                message: '权限创建成功',
                data: { permissionId, name, code }
            };
        } catch (error) {
            return { success: false, message: '创建权限失败: ' + error.message };
        }
    }

    // 获取权限列表
    getPermissions(page = 1, pageSize = 20, filters = {}) {
        try {
            let whereConditions = ['1=1'];
            let whereValues = [];

            if (filters.module) {
                whereConditions.push('module = ?');
                whereValues.push(filters.module);
            }
            if (filters.isActive !== undefined) {
                whereConditions.push('isActive = ?');
                whereValues.push(filters.isActive ? 1 : 0);
            }
            if (filters.search) {
                whereConditions.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)');
                const searchTerm = `%${filters.search}%`;
                whereValues.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * pageSize;

            let permissions = [];
            let totalCount = 0;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    SELECT * FROM permissions 
                    WHERE ${whereClause}
                    ORDER BY module, name
                    LIMIT ? OFFSET ?
                `, [...whereValues, pageSize, offset]);

                for (let i = 0; i < result.rows.length; i++) {
                    permissions.push(result.rows.item(i));
                }

                const countResult = tx.executeSql(`
                    SELECT COUNT(*) as count FROM permissions WHERE ${whereClause}
                `, whereValues);
                if (countResult.rows.length > 0) {
                    totalCount = countResult.rows.item(0).count;
                }
            });

            return {
                success: true,
                message: '获取权限列表成功',
                data: {
                    permissions,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize)
                    }
                }
            };
        } catch (error) {
            return { success: false, message: '获取权限列表失败: ' + error.message };
        }
    }

    // ==================== 角色管理 ====================

    // 创建角色
    createRole(roleData, operatorId) {
        try {
            const { name, code, description, level } = roleData;

            if (!name || !code) {
                return { success: false, message: '角色名称和代码不能为空' };
            }

            // 检查角色代码是否已存在
            let existing = false;
            this.db.transaction(tx => {
                const result = tx.executeSql("SELECT id FROM roles WHERE code = ?", [code]);
                existing = result.rows.length > 0;
            });

            if (existing) {
                return { success: false, message: '角色代码已存在' };
            }

            const now = this.getCurrentTimeISO();
            let roleId = null;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    INSERT INTO roles (name, code, description, level, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [name, code, description || '', level || 0, now, now]);
                roleId = result.insertId;
            });

            this.logPermissionAction(null, operatorId, 'create_role', 'role', roleId, {
                name, code, level
            });

            return {
                success: true,
                message: '角色创建成功',
                data: { roleId, name, code }
            };
        } catch (error) {
            return { success: false, message: '创建角色失败: ' + error.message };
        }
    }

    // 获取角色列表
    getRoles(page = 1, pageSize = 20, filters = {}) {
        try {
            let whereConditions = ['1=1'];
            let whereValues = [];

            if (filters.isActive !== undefined) {
                whereConditions.push('isActive = ?');
                whereValues.push(filters.isActive ? 1 : 0);
            }
            if (filters.isSystem !== undefined) {
                whereConditions.push('isSystem = ?');
                whereValues.push(filters.isSystem ? 1 : 0);
            }
            if (filters.search) {
                whereConditions.push('(name LIKE ? OR code LIKE ? OR description LIKE ?)');
                const searchTerm = `%${filters.search}%`;
                whereValues.push(searchTerm, searchTerm, searchTerm);
            }

            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * pageSize;

            let roles = [];
            let totalCount = 0;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    SELECT r.*, 
                           (SELECT COUNT(*) FROM user_roles ur WHERE ur.roleId = r.id AND ur.isActive = 1) as userCount,
                           (SELECT COUNT(*) FROM role_permissions rp WHERE rp.roleId = r.id) as permissionCount
                    FROM roles r
                    WHERE ${whereClause}
                    ORDER BY level DESC, name
                    LIMIT ? OFFSET ?
                `, [...whereValues, pageSize, offset]);

                for (let i = 0; i < result.rows.length; i++) {
                    roles.push(result.rows.item(i));
                }

                const countResult = tx.executeSql(`
                    SELECT COUNT(*) as count FROM roles WHERE ${whereClause}
                `, whereValues);
                if (countResult.rows.length > 0) {
                    totalCount = countResult.rows.item(0).count;
                }
            });

            return {
                success: true,
                message: '获取角色列表成功',
                data: {
                    roles,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize)
                    }
                }
            };
        } catch (error) {
            return { success: false, message: '获取角色列表失败: ' + error.message };
        }
    }

    // 为角色分配权限
    assignPermissionsToRole(roleId, permissionIds, operatorId) {
        try {
            // 检查角色是否存在
            let role = null;
            this.db.transaction(tx => {
                const result = tx.executeSql("SELECT * FROM roles WHERE id = ?", [roleId]);
                if (result.rows.length === 0) {
                    throw new Error('角色不存在');
                }
                role = result.rows.item(0);
            });

            // 检查权限是否存在
            let validPermissions = 0;
            this.db.transaction(tx => {
                const placeholders = permissionIds.map(() => '?').join(',');
                const result = tx.executeSql(`
                    SELECT COUNT(*) as count FROM permissions WHERE id IN (${placeholders})
                `, permissionIds);
                if (result.rows.length > 0) {
                    validPermissions = result.rows.item(0).count;
                }
            });

            if (validPermissions !== permissionIds.length) {
                return { success: false, message: '部分权限不存在' };
            }

            const now = this.getCurrentTimeISO();

            this.db.transaction(tx => {
                // 删除现有权限分配
                tx.executeSql("DELETE FROM role_permissions WHERE roleId = ?", [roleId]);

                // 分配新权限
                for (const permissionId of permissionIds) {
                    tx.executeSql(`
                        INSERT INTO role_permissions (roleId, permissionId, grantedBy, grantedAt)
                        VALUES (?, ?, ?, ?)
                    `, [roleId, permissionId, operatorId, now]);
                }
            });

            this.logPermissionAction(null, operatorId, 'assign_permissions_to_role', 'role', roleId, {
                permissionIds,
                roleName: role.name
            });

            return { success: true, message: '权限分配成功' };
        } catch (error) {
            return { success: false, message: '分配权限失败: ' + error.message };
        }
    }

    // 获取角色的权限
    getRolePermissions(roleId) {
        try {
            let permissions = [];

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    SELECT p.*, rp.grantedAt, rp.grantedBy
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permissionId
                    WHERE rp.roleId = ? AND p.isActive = 1
                    ORDER BY p.module, p.name
                `, [roleId]);

                for (let i = 0; i < result.rows.length; i++) {
                    permissions.push(result.rows.item(i));
                }
            });

            return {
                success: true,
                message: '获取角色权限成功',
                data: { permissions }
            };
        } catch (error) {
            return { success: false, message: '获取角色权限失败: ' + error.message };
        }
    }

    // ==================== 用户权限管理 ====================

    // 为用户分配角色
    assignRolesToUser(userId, roleIds, operatorId, expiresAt = null) {
        try {
            // 检查角色是否存在
            let roles = [];
            this.db.transaction(tx => {
                const placeholders = roleIds.map(() => '?').join(',');
                const result = tx.executeSql(`
                    SELECT id, name FROM roles WHERE id IN (${placeholders}) AND isActive = 1
                `, roleIds);

                for (let i = 0; i < result.rows.length; i++) {
                    roles.push(result.rows.item(i));
                }
            });

            if (roles.length !== roleIds.length) {
                return { success: false, message: '部分角色不存在或已禁用' };
            }

            const now = this.getCurrentTimeISO();

            this.db.transaction(tx => {
                // 先禁用用户现有的角色分配
                tx.executeSql("UPDATE user_roles SET isActive = 0 WHERE userId = ?", [userId]);

                // 分配新角色
                for (const roleId of roleIds) {
                    tx.executeSql(`
                        INSERT OR REPLACE INTO user_roles (userId, roleId, assignedBy, assignedAt, expiresAt, isActive)
                        VALUES (?, ?, ?, ?, ?, 1)
                    `, [userId, roleId, operatorId, now, expiresAt]);
                }
            });

            this.logPermissionAction(userId, operatorId, 'assign_roles_to_user', 'user', userId, {
                roleIds,
                roleNames: roles.map(r => r.name)
            });

            return { success: true, message: '角色分配成功' };
        } catch (error) {
            return { success: false, message: '分配角色失败: ' + error.message };
        }
    }

    // 为用户分配直接权限
    assignPermissionToUser(userId, permissionId, type, operatorId, expiresAt = null, reason = '') {
        try {
            // 检查权限是否存在
            let permission = null;
            this.db.transaction(tx => {
                const result = tx.executeSql("SELECT * FROM permissions WHERE id = ? AND isActive = 1", [permissionId]);
                if (result.rows.length === 0) {
                    throw new Error('权限不存在或已禁用');
                }
                permission = result.rows.item(0);
            });

            const now = this.getCurrentTimeISO();

            this.db.transaction(tx => {
                tx.executeSql(`
                    INSERT OR REPLACE INTO user_permissions (userId, permissionId, type, assignedBy, assignedAt, expiresAt, reason)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [userId, permissionId, type, operatorId, now, expiresAt, reason]);
            });

            this.logPermissionAction(userId, operatorId, 'assign_permission_to_user', 'user', userId, {
                permissionId,
                permissionName: permission.name,
                type,
                reason
            });

            return { success: true, message: '权限分配成功' };
        } catch (error) {
            return { success: false, message: '分配权限失败: ' + error.message };
        }
    }

    // 获取用户的所有权限
    getUserPermissions(userId) {
        try {
            const now = this.getCurrentTimeISO();

            let rolePermissions = [];
            let directPermissions = [];

            this.db.transaction(tx => {
                // 通过角色获得的权限
                const roleResult = tx.executeSql(`
                    SELECT DISTINCT p.*, 'role' as source, r.name as sourceName
                    FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permissionId
                    JOIN user_roles ur ON rp.roleId = ur.roleId
                    JOIN roles r ON ur.roleId = r.id
                    WHERE ur.userId = ? 
                      AND ur.isActive = 1 
                      AND (ur.expiresAt IS NULL OR ur.expiresAt > ?)
                      AND p.isActive = 1
                      AND r.isActive = 1
                `, [userId, now]);

                for (let i = 0; i < roleResult.rows.length; i++) {
                    rolePermissions.push(roleResult.rows.item(i));
                }

                // 直接分配的权限
                const directResult = tx.executeSql(`
                    SELECT p.*, up.type, 'direct' as source, up.reason as sourceName
                    FROM permissions p
                    JOIN user_permissions up ON p.id = up.permissionId
                    WHERE up.userId = ? 
                      AND (up.expiresAt IS NULL OR up.expiresAt > ?)
                      AND p.isActive = 1
                `, [userId, now]);

                for (let i = 0; i < directResult.rows.length; i++) {
                    directPermissions.push(directResult.rows.item(i));
                }
            });

            // 合并权限，处理冲突（deny优先于grant）
            const permissionMap = new Map();

            // 先添加角色权限
            rolePermissions.forEach(perm => {
                permissionMap.set(perm.code, { ...perm, granted: true });
            });

            // 再处理直接权限
            directPermissions.forEach(perm => {
                if (perm.type === 'deny') {
                    permissionMap.set(perm.code, { ...perm, granted: false });
                } else if (perm.type === 'grant' && !permissionMap.has(perm.code)) {
                    permissionMap.set(perm.code, { ...perm, granted: true });
                }
            });

            const finalPermissions = Array.from(permissionMap.values()).filter(p => p.granted);

            return {
                success: true,
                message: '获取用户权限成功',
                data: {
                    permissions: finalPermissions,
                    rolePermissions,
                    directPermissions
                }
            };
        } catch (error) {
            return { success: false, message: '获取用户权限失败: ' + error.message };
        }
    }

    // 检查用户是否有特定权限
    hasPermission(userId, permissionCode) {
        try {
            const userPermissions = this.getUserPermissions(userId);
            if (!userPermissions.success) {
                return { success: false, hasPermission: false };
            }

            const hasPermission = userPermissions.data.permissions.some(p => p.code === permissionCode);

            return {
                success: true,
                hasPermission,
                message: hasPermission ? '用户拥有该权限' : '用户没有该权限'
            };
        } catch (error) {
            return { success: false, hasPermission: false, message: '检查权限失败: ' + error.message };
        }
    }

    // 获取用户的角色
    getUserRoles(userId) {
        try {
            const now = this.getCurrentTimeISO();
            let roles = [];

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    SELECT r.*, ur.assignedAt, ur.expiresAt, ur.assignedBy
                    FROM roles r
                    JOIN user_roles ur ON r.id = ur.roleId
                    WHERE ur.userId = ? 
                      AND ur.isActive = 1 
                      AND (ur.expiresAt IS NULL OR ur.expiresAt > ?)
                      AND r.isActive = 1
                    ORDER BY r.level DESC
                `, [userId, now]);

                for (let i = 0; i < result.rows.length; i++) {
                    roles.push(result.rows.item(i));
                }
            });

            return {
                success: true,
                message: '获取用户角色成功',
                data: { roles }
            };
        } catch (error) {
            return { success: false, message: '获取用户角色失败: ' + error.message };
        }
    }

    // 获取权限操作日志
    getPermissionLogs(page = 1, pageSize = 20, filters = {}) {
        try {
            let whereConditions = ['1=1'];
            let whereValues = [];

            if (filters.userId) {
                whereConditions.push('userId = ?');
                whereValues.push(filters.userId);
            }
            if (filters.operatorId) {
                whereConditions.push('operatorId = ?');
                whereValues.push(filters.operatorId);
            }
            if (filters.action) {
                whereConditions.push('action = ?');
                whereValues.push(filters.action);
            }
            if (filters.targetType) {
                whereConditions.push('targetType = ?');
                whereValues.push(filters.targetType);
            }

            const whereClause = whereConditions.join(' AND ');
            const offset = (page - 1) * pageSize;

            let logs = [];
            let totalCount = 0;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    SELECT * FROM permission_logs 
                    WHERE ${whereClause}
                    ORDER BY createdAt DESC
                    LIMIT ? OFFSET ?
                `, [...whereValues, pageSize, offset]);

                for (let i = 0; i < result.rows.length; i++) {
                    logs.push(result.rows.item(i));
                }

                const countResult = tx.executeSql(`
                    SELECT COUNT(*) as count FROM permission_logs WHERE ${whereClause}
                `, whereValues);
                if (countResult.rows.length > 0) {
                    totalCount = countResult.rows.item(0).count;
                }
            });

            return {
                success: true,
                message: '获取权限日志成功',
                data: {
                    logs,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize)
                    }
                }
            };
        } catch (error) {
            return { success: false, message: '获取权限日志失败: ' + error.message };
        }
    }
}

// 创建全局实例
const permissionManager = new PermissionManager();

export default permissionManager;