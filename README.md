# 用户管理API - 同步编程风格

基于QMLNode的同步编程风格用户管理后端接口，支持用户注册、登录、会话管理、权限控制等功能。

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 运行方式

#### 1. 直接使用API（同步方式）
```bash
# 运行基本API
npm start

# 运行测试
npm test

# 运行示例
npm example
```

#### 2. Web服务器（HTTP接口）
```bash
# 启动Web服务器
npm run web

# 在另一个终端测试Web API
npm run web-test
```

#### 3. 使用curl测试
```bash
# 确保Web服务器正在运行
npm run web

# 在另一个终端运行curl测试
bash curl-test.sh
```

#### 4. 使用Web界面测试
```bash
# 启动Web服务器
npm run web

# 在浏览器中打开
open web-test.html
# 或访问 http://localhost:3000（会自动重定向到API文档）
```

## � Web API接口

### 基础信息
- **服务地址**: `http://localhost:3000`
- **API前缀**: `/api`
- **认证方式**: 会话令牌（Header: `X-Session-Token`）

### 接口列表

#### 用户注册
```http
POST /api/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "userRole": "user",
  "profileData": {
    "nickname": "测试用户"
  }
}
```

#### 用户登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "ipAddress": "127.0.0.1",
  "userAgent": "MyApp/1.0"
}
```

#### 验证会话
```http
GET /api/session
X-Session-Token: your_session_token
```

#### 用户登出
```http
POST /api/logout
X-Session-Token: your_session_token
```

#### 更新用户信息
```http
PUT /api/users/{userId}
X-Session-Token: your_session_token
Content-Type: application/json

{
  "email": "newemail@example.com",
  "profileData": {
    "nickname": "新昵称"
  }
}
```

#### 删除用户
```http
DELETE /api/users/{userId}
X-Session-Token: your_session_token
```

#### 获取用户列表（管理员）
```http
GET /api/users?page=1&pageSize=10
X-Session-Token: admin_session_token
```

#### 获取操作日志（管理员）
```http
GET /api/logs?page=1&pageSize=20&userId=1
X-Session-Token: admin_session_token
```

#### 健康检查
```http
GET /health
```

#### API文档
```http
GET /api/docs
```

## � 核心功能

### 用户管理
- ✅ 用户注册（支持角色：user/admin/vip）
- ✅ 用户登录/登出
- ✅ 密码哈希+盐值存储
- ✅ 会话管理（令牌过期控制）
- ✅ 用户信息更新
- ✅ 用户删除
- ✅ 登录失败次数限制
- ✅ 账户锁定机制

### 权限控制
- ✅ 基于角色的权限控制
- ✅ 管理员功能（用户列表、日志查看）
- ✅ 用户只能修改自己的信息
- ✅ 会话令牌验证

### 数据持久化
- ✅ 基于QMLNode的同步数据库操作
- ✅ 自动数据持久化
- ✅ 配置文件管理
- ✅ 操作日志记录

### Web功能
- ✅ HTTP RESTful API
- ✅ CORS支持
- ✅ JSON响应格式
- ✅ 错误处理
- ✅ 请求日志
- ✅ 优雅关闭

## 📊 数据库结构

### users表
- `id`: 用户ID（主键）
- `username`: 用户名（唯一）
- `email`: 邮箱（唯一）
- `passwordHash`: 密码哈希
- `salt`: 密码盐值
- `userRole`: 用户角色
- `isActive`: 是否激活
- `failedLoginAttempts`: 登录失败次数
- `lockedUntil`: 锁定到期时间
- `profileData`: 用户资料（JSON）
- `createdAt`: 创建时间
- `lastLoginAt`: 最后登录时间

### user_sessions表
- `id`: 会话ID（主键）
- `userId`: 用户ID
- `sessionToken`: 会话令牌
- `expiresAt`: 过期时间
- `ipAddress`: IP地址
- `userAgent`: 用户代理
- `createdAt`: 创建时间

### session_blacklist表
- `id`: 黑名单ID（主键）
- `sessionToken`: 失效的会话令牌
- `createdAt`: 创建时间

### user_logs表
- `id`: 日志ID（主键）
- `userId`: 用户ID
- `action`: 操作类型
- `details`: 操作详情
- `ipAddress`: IP地址
- `userAgent`: 用户代理
- `createdAt`: 创建时间

## 🛠️ 开发工具

### 可用脚本
```bash
npm start          # 运行基本API
npm test           # 运行测试套件
npm example        # 运行使用示例
npm run web        # 启动Web服务器
npm run web-test   # 运行Web客户端测试
npm run dev        # 调试模式运行
npm run clean      # 清理数据库
```

### 测试工具
- `test-user-api.mjs`: 完整测试套件
- `web-client-test.mjs`: Web API测试
- `curl-test.sh`: curl命令行测试
- `web-test.html`: 浏览器界面测试

## 🔒 安全特性

- **密码安全**: 使用哈希+盐值存储密码
- **会话管理**: 令牌过期控制，登出黑名单机制
- **登录保护**: 失败次数限制，账户锁定
- **权限控制**: 基于角色的访问控制
- **操作审计**: 完整的操作日志记录
- **输入验证**: 参数验证和错误处理

## 📝 使用示例

### JavaScript/Node.js客户端
```javascript
import UserManagementWebClient from './web-client-test.mjs';

const client = new UserManagementWebClient('http://localhost:3000');

// 注册用户
await client.register({
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
});

// 登录
await client.login({
  username: 'testuser',
  password: 'password123'
});

// 验证会话
await client.validateSession();
```

### curl命令示例
```bash
# 注册用户
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'

# 登录
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 验证会话
curl -X GET http://localhost:3000/api/session \
  -H "X-Session-Token: your_token_here"
```

## 🌐 部署说明

### 本地开发
```bash
# 启动Web服务器
npm run web

# 服务器将在 http://localhost:3000 启动
```

### 生产环境
```bash
# 设置端口
export PORT=8080

# 启动服务器
npm run web
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "web"]
```

## 🤝 技术栈

- **运行时**: Node.js 14+
- **数据库**: QMLNode LocalStorage（同步）
- **Web服务器**: Node.js http模块
- **认证**: 会话令牌
- **安全**: 密码哈希、盐值、会话管理
- **测试**: 自定义测试套件

## 📄 许可证

MIT License

## 🔗 相关链接

- [QMLNode文档](./qmlnode-1.0.0.tgz)
- [API文档](http://localhost:3000/api/docs)
- [健康检查](http://localhost:3000/health)

