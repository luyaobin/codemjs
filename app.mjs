import { QLocalStorage, QSettings, QTimeUtils } from 'qmlnode';

// 用户管理后端接口类
class UserManagementAPI {
    constructor() {
        this.dbName = 'user_management_db';
        this.db = null;
        this.settings = null;
        this.init();
    }

    // 获取当前时间的ISO字符串
    getCurrentTimeISO() {
        return new Date().toISOString();
    }

    // 初始化数据库和设置
    init() {
        try {
            // 初始化设置
            this.settings = QSettings.open('user_api_config', {
                maxLoginAttempts: 5,
                sessionTimeout: 3600000, // 1小时
                passwordMinLength: 6,
                enableLogging: true
            });

            // 初始化数据库
            this.db = QLocalStorage.openDatabaseSync(this.dbName, '1.0', '用户管理数据库', 1000000);
            
            if (!this.db) {
                throw new Error('无法打开数据库');
            }

            // 创建用户表
            this.createTables();
            
            console.log('用户管理API初始化成功');
            this.log('系统启动', { timestamp: this.getCurrentTimeISO() });
            
        } catch (error) {
            console.error('初始化失败:', error);
            throw error;
        }
    }

    // 创建数据库表
    createTables() {
        this.db.transaction(tx => {
            // 用户表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    last_login TEXT,
                    login_attempts INTEGER DEFAULT 0,
                    is_locked BOOLEAN DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    user_role TEXT DEFAULT 'user',
                    profile_data TEXT DEFAULT '{}'
                )
            `);

            // 会话表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // 会话黑名单表（用于登出的会话）
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS session_blacklist (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_token TEXT NOT NULL,
                    blacklisted_at TEXT NOT NULL
                )
            `);

            // 操作日志表
            tx.executeSql(`
                CREATE TABLE IF NOT EXISTS user_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action TEXT NOT NULL,
                    details TEXT,
                    ip_address TEXT,
                    timestamp TEXT NOT NULL,
                    success BOOLEAN DEFAULT 1
                )
            `);

            console.log('数据库表创建完成');
        });
    }

    // 生成随机盐值
    generateSalt() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let salt = '';
        for (let i = 0; i < 16; i++) {
            salt += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return salt;
    }

    // 简单的密码哈希（生产环境建议使用bcrypt等）
    hashPassword(password, salt) {
        // 这里使用简单的哈希，实际项目中应该使用更安全的方法
        let hash = 0;
        const str = password + salt;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(16);
    }

    // 生成会话令牌
    generateSessionToken() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2);
        return `${timestamp}_${random}`;
    }

    // 记录日志
    log(action, details = {}, userId = null, success = true) {
        if (!this.settings.value('enableLogging')) return;

        this.db.transaction(tx => {
            tx.executeSql(
                'INSERT INTO user_logs (user_id, action, details, timestamp, success) VALUES (?, ?, ?, ?, ?)',
                [userId, action, JSON.stringify(details), this.getCurrentTimeISO(), success ? 1 : 0]
            );
        });
    }

    // 用户注册
    register(userData) {
        const { username, email, password, userRole = 'user', profileData = {} } = userData;

        try {
            // 验证输入
            if (!username || !email || !password) {
                throw new Error('用户名、邮箱和密码不能为空');
            }

            if (password.length < this.settings.value('passwordMinLength')) {
                throw new Error(`密码长度不能少于${this.settings.value('passwordMinLength')}位`);
            }

            // 检查用户是否已存在
            let userExists = false;
            this.db.transaction(tx => {
                const result = tx.executeSql(
                    'SELECT id FROM users WHERE username = ? OR email = ?',
                    [username, email]
                );
                userExists = result.rows.length > 0;
            });

            if (userExists) {
                throw new Error('用户名或邮箱已存在');
            }

            // 创建新用户
            const salt = this.generateSalt();
            const passwordHash = this.hashPassword(password, salt);
            const now = this.getCurrentTimeISO();
            let newUserId = null;

            this.db.transaction(tx => {
                const result = tx.executeSql(`
                    INSERT INTO users (
                        username, email, password_hash, salt, 
                        created_at, updated_at, user_role, profile_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    username, email, passwordHash, salt,
                    now, now, userRole, JSON.stringify(profileData)
                ]);
                newUserId = result.insertId;
            });

            this.log('用户注册', { username, email, userRole }, newUserId);

            return {
                success: true,
                message: '注册成功',
                data: {
                    userId: newUserId,
                    username,
                    email,
                    userRole,
                    createdAt: now
                }
            };

        } catch (error) {
            this.log('用户注册失败', { username, email, error: error.message }, null, false);
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 用户登录
    login(credentials) {
        const { username, password, ipAddress = '', userAgent = '' } = credentials;

        try {
            if (!username || !password) {
                throw new Error('用户名和密码不能为空');
            }

            let user = null;
            
            // 获取用户信息
            this.db.transaction(tx => {
                const result = tx.executeSql(
                    'SELECT * FROM users WHERE username = ? OR email = ?',
                    [username, username]
                );
                
                if (result.rows.length === 0) {
                    throw new Error('用户不存在');
                }
                
                user = result.rows.item(0);
            });

            // 检查用户状态
            if (!user.is_active) {
                throw new Error('账户已被禁用');
            }

            if (user.is_locked) {
                throw new Error('账户已被锁定，请联系管理员');
            }

            // 验证密码
            const passwordHash = this.hashPassword(password, user.salt);
            if (passwordHash !== user.password_hash) {
                // 增加登录失败次数
                this.db.transaction(tx => {
                    const attempts = user.login_attempts + 1;
                    const isLocked = attempts >= this.settings.value('maxLoginAttempts') ? 1 : 0;
                    
                    tx.executeSql(
                        'UPDATE users SET login_attempts = ?, is_locked = ? WHERE id = ?',
                        [attempts, isLocked, user.id]
                    );
                });

                this.log('登录失败', { username, reason: '密码错误' }, user.id, false);
                throw new Error('密码错误');
            }

            // 创建会话
            const sessionToken = this.generateSessionToken();
            const now = this.getCurrentTimeISO();
            const sessionTimeoutMs = parseInt(this.settings.value('sessionTimeout')) || 3600000; // 默认1小时
            const expiresAt = new Date(Date.now() + sessionTimeoutMs).toISOString();

            this.db.transaction(tx => {
                // 清除旧会话
                tx.executeSql(
                    'UPDATE user_sessions SET is_active = 0 WHERE user_id = ?',
                    [user.id]
                );

                // 创建新会话
                tx.executeSql(`
                    INSERT INTO user_sessions (
                        user_id, session_token, created_at, expires_at, 
                        ip_address, user_agent
                    ) VALUES (?, ?, ?, ?, ?, ?)
                `, [user.id, sessionToken, now, expiresAt, ipAddress, userAgent]);

                // 更新用户登录信息
                tx.executeSql(
                    'UPDATE users SET last_login = ?, login_attempts = 0 WHERE id = ?',
                    [now, user.id]
                );
            });

            this.log('用户登录', { username, ipAddress }, user.id);

            return {
                success: true,
                message: '登录成功',
                data: {
                    userId: user.id,
                    username: user.username,
                    email: user.email,
                    userRole: user.user_role,
                    sessionToken,
                    expiresAt,
                    profileData: JSON.parse(user.profile_data || '{}')
                }
            };

        } catch (error) {
            this.log('登录失败', { username, error: error.message }, null, false);
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 验证会话
    validateSession(sessionToken) {
        try {
            if (!sessionToken) {
                throw new Error('会话令牌不能为空');
            }

            let session = null;
            let user = null;
            let isBlacklisted = false;

            this.db.transaction(tx => {
                // 检查会话是否在黑名单中
                const blacklistResult = tx.executeSql(`
                    SELECT * FROM session_blacklist 
                    WHERE session_token = ?
                `, [sessionToken]);

                if (blacklistResult.rows.length > 0) {
                    isBlacklisted = true;
                    throw new Error('会话已失效');
                }

                // 查询会话
                const sessionResult = tx.executeSql(`
                    SELECT * FROM user_sessions 
                    WHERE session_token = ? AND is_active = 1
                `, [sessionToken]);

                if (sessionResult.rows.length === 0) {
                    throw new Error('无效的会话令牌');
                }

                session = sessionResult.rows.item(0);

                // 查询用户信息
                const userResult = tx.executeSql(`
                    SELECT username, email, user_role, is_active, profile_data 
                    FROM users 
                    WHERE id = ?
                `, [session.user_id]);

                if (userResult.rows.length === 0) {
                    throw new Error('用户不存在');
                }

                user = userResult.rows.item(0);
            });

            // 检查会话是否过期
            const now = new Date();
            const expiresAt = new Date(session.expires_at);
            
            if (now > expiresAt) {
                // 将过期会话加入黑名单
                this.db.transaction(tx => {
                    tx.executeSql(
                        'INSERT INTO session_blacklist (session_token, blacklisted_at) VALUES (?, ?)',
                        [sessionToken, this.getCurrentTimeISO()]
                    );
                });
                throw new Error('会话已过期');
            }

            // 检查用户状态
            if (!user.is_active) {
                throw new Error('用户账户已被禁用');
            }

            return {
                success: true,
                message: '会话有效',
                data: {
                    userId: session.user_id,
                    username: user.username,
                    email: user.email,
                    userRole: user.user_role,
                    sessionToken,
                    expiresAt: session.expires_at,
                    profileData: JSON.parse(user.profile_data || '{}')
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 用户登出
    logout(sessionToken) {
        try {
            if (!sessionToken) {
                throw new Error('会话令牌不能为空');
            }

            let userId = null;
            let sessionExists = false;

            this.db.transaction(tx => {
                // 检查会话是否存在
                const result = tx.executeSql(
                    'SELECT user_id FROM user_sessions WHERE session_token = ?',
                    [sessionToken]
                );
                
                if (result.rows.length > 0) {
                    userId = result.rows.item(0).user_id;
                    sessionExists = true;
                    
                    // 将会话令牌加入黑名单
                    tx.executeSql(
                        'INSERT INTO session_blacklist (session_token, blacklisted_at) VALUES (?, ?)',
                        [sessionToken, this.getCurrentTimeISO()]
                    );
                } else {
                    throw new Error('会话令牌不存在');
                }
            });

            if (!sessionExists) {
                throw new Error('登出失败，会话令牌无效');
            }

            this.log('用户登出', { sessionToken }, userId);

            return {
                success: true,
                message: '登出成功',
                data: null
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 删除用户
    deleteUser(userId, operatorSessionToken) {
        try {
            // 验证操作者权限
            const operatorSession = this.validateSession(operatorSessionToken);
            if (!operatorSession.success) {
                throw new Error('无效的操作者会话');
            }

            if (operatorSession.data.userRole !== 'admin' && operatorSession.data.userId !== userId) {
                throw new Error('权限不足，只能删除自己的账户或需要管理员权限');
            }

            let deletedUser = null;

            this.db.transaction(tx => {
                // 获取要删除的用户信息
                const userResult = tx.executeSql('SELECT * FROM users WHERE id = ?', [userId]);
                if (userResult.rows.length === 0) {
                    throw new Error('用户不存在');
                }
                deletedUser = userResult.rows.item(0);

                // 删除用户会话
                tx.executeSql('DELETE FROM user_sessions WHERE user_id = ?', [userId]);

                // 删除用户
                tx.executeSql('DELETE FROM users WHERE id = ?', [userId]);
            });

            this.log('删除用户', { 
                deletedUserId: userId, 
                deletedUsername: deletedUser.username,
                operatorId: operatorSession.data.userId 
            }, operatorSession.data.userId);

            return {
                success: true,
                message: '用户删除成功',
                data: {
                    deletedUserId: userId,
                    deletedUsername: deletedUser.username
                }
            };

        } catch (error) {
            this.log('删除用户失败', { userId, error: error.message }, null, false);
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 获取用户列表（管理员功能）
    getUserList(sessionToken, page = 1, pageSize = 10) {
        try {
            // 验证管理员权限
            const session = this.validateSession(sessionToken);
            if (!session.success) {
                throw new Error('无效的会话');
            }

            if (session.data.userRole !== 'admin') {
                throw new Error('权限不足，需要管理员权限');
            }

            let users = [];
            let totalCount = 0;

            this.db.transaction(tx => {
                // 获取总数
                const countResult = tx.executeSql('SELECT COUNT(*) as count FROM users');
                totalCount = countResult.rows.item(0).count;

                // 获取用户列表
                const offset = (page - 1) * pageSize;
                const result = tx.executeSql(`
                    SELECT id, username, email, created_at, last_login, 
                           is_active, is_locked, user_role, login_attempts
                    FROM users 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?
                `, [pageSize, offset]);

                for (let i = 0; i < result.rows.length; i++) {
                    users.push(result.rows.item(i));
                }
            });

            return {
                success: true,
                message: '获取用户列表成功',
                data: {
                    users,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize)
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 更新用户信息
    updateUser(userId, updateData, sessionToken) {
        try {
            // 验证会话
            const session = this.validateSession(sessionToken);
            if (!session.success) {
                throw new Error('无效的会话');
            }

            // 权限检查：只能更新自己的信息，或者管理员可以更新任何人
            if (session.data.userId !== userId && session.data.userRole !== 'admin') {
                throw new Error('权限不足');
            }

            const { email, userRole, profileData, isActive } = updateData;
            const now = this.getCurrentTimeISO();
            
            this.db.transaction(tx => {
                // 检查用户是否存在
                const userResult = tx.executeSql('SELECT id FROM users WHERE id = ?', [userId]);
                if (userResult.rows.length === 0) {
                    throw new Error('用户不存在');
                }

                // 构建更新SQL
                let updateFields = ['updated_at = ?'];
                let updateValues = [now];

                if (email !== undefined) {
                    updateFields.push('email = ?');
                    updateValues.push(email);
                }

                if (userRole !== undefined && session.data.userRole === 'admin') {
                    updateFields.push('user_role = ?');
                    updateValues.push(userRole);
                }

                if (profileData !== undefined) {
                    updateFields.push('profile_data = ?');
                    updateValues.push(JSON.stringify(profileData));
                }

                if (isActive !== undefined && session.data.userRole === 'admin') {
                    updateFields.push('is_active = ?');
                    updateValues.push(isActive ? 1 : 0);
                }

                updateValues.push(userId);

                tx.executeSql(
                    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
                    updateValues
                );
            });

            this.log('更新用户信息', { userId, updateData }, session.data.userId);

            return {
                success: true,
                message: '用户信息更新成功',
                data: { userId }
            };

        } catch (error) {
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }

    // 获取操作日志（管理员功能）
    getLogs(sessionToken, page = 1, pageSize = 20, userId = null) {
        try {
            // 验证管理员权限
            const session = this.validateSession(sessionToken);
            if (!session.success) {
                throw new Error('无效的会话');
            }

            if (session.data.userRole !== 'admin') {
                throw new Error('权限不足，需要管理员权限');
            }

            let logs = [];
            let totalCount = 0;

            this.db.transaction(tx => {
                let countSql = 'SELECT COUNT(*) as count FROM user_logs';
                let logSql = `
                    SELECT l.*, u.username 
                    FROM user_logs l 
                    LEFT JOIN users u ON l.user_id = u.id
                `;
                let params = [];

                if (userId) {
                    countSql += ' WHERE user_id = ?';
                    logSql += ' WHERE l.user_id = ?';
                    params.push(userId);
                }

                // 获取总数
                const countResult = tx.executeSql(countSql, params);
                totalCount = countResult.rows.item(0).count;

                // 获取日志
                logSql += ' ORDER BY l.timestamp DESC LIMIT ? OFFSET ?';
                const offset = (page - 1) * pageSize;
                params.push(pageSize, offset);

                const result = tx.executeSql(logSql, params);
                for (let i = 0; i < result.rows.length; i++) {
                    const log = result.rows.item(i);
                    log.details = JSON.parse(log.details || '{}');
                    logs.push(log);
                }
            });

            return {
                success: true,
                message: '获取日志成功',
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
            return {
                success: false,
                message: error.message,
                data: null
            };
        }
    }
}

// 创建API实例
const userAPI = new UserManagementAPI();

// 导出API实例和类
export { UserManagementAPI, userAPI };
export default userAPI;