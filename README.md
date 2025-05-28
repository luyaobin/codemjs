# 用户管理API - 基于QMLNode的同步后端接口

这是一个基于QMLNode的完整用户账号管理后端接口系统，采用同步编程风格，提供用户注册、登录、会话管理、权限控制等功能。

## 🚀 特性

- **完整的用户管理** - 注册、登录、登出、删除用户
- **会话管理** - 安全的会话令牌系统，支持过期控制
- **权限控制** - 基于角色的权限管理（用户/管理员）
- **安全功能** - 密码哈希、登录失败锁定、会话验证
- **操作日志** - 完整的用户操作记录和审计
- **同步编程** - 所有操作都采用同步方式，适合QML集成
- **数据持久化** - 基于QMLNode的本地数据库存储

## 📦 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 运行主应用

```bash
npm start
```

### 3. 运行测试

```bash
npm test
```

### 4. 运行示例演示

```bash
npm run example
```

## 🔧 API接口

### 用户注册

```javascript
import userAPI from './app.mjs';

const result = userAPI.register({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    userRole: 'user', // 可选: 'user' | 'admin' | 'vip'
    profileData: {    // 可选: 用户资料
        nickname: '测试用户',
        age: 25,
        city: '北京'
    }
});

if (result.success) {
    console.log('注册成功:', result.data);
    // result.data 包含: userId, username, email, userRole, createdAt
} else {
    console.log('注册失败:', result.message);
}
```

### 用户登录

```javascript
const result = userAPI.login({
    username: 'testuser',     // 用户名或邮箱
    password: 'password123',
    ipAddress: '127.0.0.1',   // 可选
    userAgent: 'Browser'      // 可选
});

if (result.success) {
    console.log('登录成功:', result.data);
    // result.data 包含: userId, username, email, userRole, sessionToken, expiresAt, profileData
    const sessionToken = result.data.sessionToken;
} else {
    console.log('登录失败:', result.message);
}
```

### 验证会话

```javascript
const result = userAPI.validateSession(sessionToken);

if (result.success) {
    console.log('会话有效:', result.data);
    // 可以获取当前用户信息
} else {
    console.log('会话无效:', result.message);
    // 需要重新登录
}
```

### 用户登出

```javascript
const result = userAPI.logout(sessionToken);

if (result.success) {
    console.log('登出成功');
} else {
    console.log('登出失败:', result.message);
}
```

### 更新用户信息

```javascript
const result = userAPI.updateUser(userId, {
    email: 'newemail@example.com',
    profileData: {
        nickname: '新昵称',
        age: 26
    }
    // 管理员还可以更新: userRole, isActive
}, sessionToken);

if (result.success) {
    console.log('更新成功');
} else {
    console.log('更新失败:', result.message);
}
```

### 删除用户

```javascript
// 用户可以删除自己的账户，管理员可以删除任何用户
const result = userAPI.deleteUser(userId, operatorSessionToken);

if (result.success) {
    console.log('删除成功:', result.data);
} else {
    console.log('删除失败:', result.message);
}
```

### 管理员功能

#### 获取用户列表

```javascript
// 需要管理员权限
const result = userAPI.getUserList(adminSessionToken, page = 1, pageSize = 10);

if (result.success) {
    console.log('用户列表:', result.data.users);
    console.log('分页信息:', result.data.pagination);
} else {
    console.log('获取失败:', result.message);
}
```

#### 获取操作日志

```javascript
// 需要管理员权限
const result = userAPI.getLogs(adminSessionToken, page = 1, pageSize = 20, userId = null);

if (result.success) {
    console.log('操作日志:', result.data.logs);
} else {
    console.log('获取失败:', result.message);
}
```

## 🔒 安全特性

### 1. 密码安全
- 使用盐值哈希存储密码
- 支持密码长度限制（默认6位）
- 生产环境建议使用更强的哈希算法

### 2. 登录保护
- 登录失败次数限制（默认5次）
- 账户自动锁定机制
- IP地址和User-Agent记录

### 3. 会话管理
- 安全的会话令牌生成
- 会话过期时间控制（默认1小时）
- 自动清理过期会话

### 4. 权限控制
- 基于角色的访问控制
- 用户只能操作自己的数据
- 管理员拥有完整权限

## 📊 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
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
);
```

### 会话表 (user_sessions)
```sql
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### 日志表 (user_logs)
```sql
CREATE TABLE user_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    timestamp TEXT NOT NULL,
    success BOOLEAN DEFAULT 1
);
```

## ⚙️ 配置选项

系统会自动创建配置文件 `data/user_api_config.ini`：

```ini
[default]
maxLoginAttempts=5
sessionTimeout=3600000
passwordMinLength=6
enableLogging=true
```

可以通过代码修改配置：

```javascript
// 获取配置
const maxAttempts = userAPI.settings.value('maxLoginAttempts');

// 设置配置
userAPI.settings.setValue('passwordMinLength', 8);
```

## 🧪 测试

项目包含完整的测试套件：

```bash
# 运行所有测试
npm test

# 运行示例演示
npm run example
```

测试覆盖：
- ✅ 用户注册（正常/异常情况）
- ✅ 用户登录（正常/错误密码/不存在用户）
- ✅ 会话验证（有效/无效/过期）
- ✅ 用户信息更新
- ✅ 权限控制测试
- ✅ 管理员功能测试
- ✅ 安全功能测试
- ✅ 错误处理测试

## 📁 项目结构

```
codemjs/
├── app.mjs                 # 主应用文件 - 用户管理API
├── test-user-api.mjs       # 完整测试套件
├── user-api-example.mjs    # 使用示例演示
├── package.json            # 项目配置
├── README.md              # 项目文档
├── data/                  # 数据存储目录
│   ├── user_management_db.json  # 用户数据库
│   └── user_api_config.ini      # 配置文件
└── logs/                  # 日志目录
    └── *.log             # 操作日志文件
```

## � 与QML集成

这个API专为QML应用设计，可以直接在QML中调用：

```qml
// QML中使用示例
import QtQuick 2.15

Item {
    Component.onCompleted: {
        // 注册用户
        var result = userAPI.register({
            username: "qmluser",
            email: "qml@example.com",
            password: "qmlpass123"
        });
        
        if (result.success) {
            console.log("QML用户注册成功");
            
            // 登录
            var loginResult = userAPI.login({
                username: "qmluser",
                password: "qmlpass123"
            });
            
            if (loginResult.success) {
                // 保存会话令牌
                sessionToken = loginResult.data.sessionToken;
            }
        }
    }
}
```

## 🚨 注意事项

1. **生产环境安全**：
   - 建议使用更强的密码哈希算法（如bcrypt）
   - 启用HTTPS传输
   - 定期更新会话令牌

2. **性能考虑**：
   - 同步操作适合中小规模应用
   - 大量并发时考虑异步版本

3. **数据备份**：
   - 定期备份用户数据
   - 监控日志文件大小

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

