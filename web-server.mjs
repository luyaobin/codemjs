import http from 'http';
import url from 'url';
import querystring from 'querystring';
import userAPI from './app.mjs';

// Web服务器类
class UserManagementWebServer {
    constructor(port = 3000) {
        this.port = port;
        this.server = null;
    }

    // 解析请求体
    parseRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    if (req.headers['content-type']?.includes('application/json')) {
                        resolve(JSON.parse(body || '{}'));
                    } else {
                        resolve(querystring.parse(body));
                    }
                } catch (error) {
                    reject(error);
                }
            });
            req.on('error', reject);
        });
    }

    // 设置CORS头
    setCORSHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
        res.setHeader('Access-Control-Max-Age', '86400');
    }

    // 发送JSON响应
    sendJSONResponse(res, statusCode, data) {
        this.setCORSHeaders(res);
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data, null, 2));
    }

    // 发送错误响应
    sendErrorResponse(res, statusCode, message) {
        this.sendJSONResponse(res, statusCode, {
            success: false,
            message,
            data: null
        });
    }

    // 获取会话令牌
    getSessionToken(req) {
        return req.headers['x-session-token'] || 
               req.headers['authorization']?.replace('Bearer ', '') || 
               null;
    }

    // 处理用户注册
    async handleRegister(req, res) {
        try {
            const body = await this.parseRequestBody(req);
            const result = userAPI.register(body);
            this.sendJSONResponse(res, result.success ? 201 : 400, result);
        } catch (error) {
            this.sendErrorResponse(res, 400, '请求数据格式错误');
        }
    }

    // 处理用户登录
    async handleLogin(req, res) {
        try {
            const body = await this.parseRequestBody(req);
            const result = userAPI.login(body);
            this.sendJSONResponse(res, result.success ? 200 : 401, result);
        } catch (error) {
            this.sendErrorResponse(res, 400, '请求数据格式错误');
        }
    }

    // 处理会话验证
    handleValidateSession(req, res) {
        const sessionToken = this.getSessionToken(req);
        if (!sessionToken) {
            this.sendErrorResponse(res, 401, '缺少会话令牌');
            return;
        }

        const result = userAPI.validateSession(sessionToken);
        this.sendJSONResponse(res, result.success ? 200 : 401, result);
    }

    // 处理用户登出
    handleLogout(req, res) {
        const sessionToken = this.getSessionToken(req);
        if (!sessionToken) {
            this.sendErrorResponse(res, 401, '缺少会话令牌');
            return;
        }

        const result = userAPI.logout(sessionToken);
        this.sendJSONResponse(res, result.success ? 200 : 400, result);
    }

    // 处理用户信息更新
    async handleUpdateUser(req, res, userId) {
        try {
            const sessionToken = this.getSessionToken(req);
            if (!sessionToken) {
                this.sendErrorResponse(res, 401, '缺少会话令牌');
                return;
            }

            const body = await this.parseRequestBody(req);
            const result = userAPI.updateUser(parseInt(userId), body, sessionToken);
            this.sendJSONResponse(res, result.success ? 200 : 400, result);
        } catch (error) {
            this.sendErrorResponse(res, 400, '请求数据格式错误');
        }
    }

    // 处理用户删除
    handleDeleteUser(req, res, userId) {
        const sessionToken = this.getSessionToken(req);
        if (!sessionToken) {
            this.sendErrorResponse(res, 401, '缺少会话令牌');
            return;
        }

        const result = userAPI.deleteUser(parseInt(userId), sessionToken);
        this.sendJSONResponse(res, result.success ? 200 : 400, result);
    }

    // 处理获取用户列表
    handleGetUserList(req, res) {
        const sessionToken = this.getSessionToken(req);
        if (!sessionToken) {
            this.sendErrorResponse(res, 401, '缺少会话令牌');
            return;
        }

        const urlParts = url.parse(req.url, true);
        const page = parseInt(urlParts.query.page) || 1;
        const pageSize = parseInt(urlParts.query.pageSize) || 10;

        const result = userAPI.getUserList(sessionToken, page, pageSize);
        this.sendJSONResponse(res, result.success ? 200 : 403, result);
    }

    // 处理获取操作日志
    handleGetLogs(req, res) {
        const sessionToken = this.getSessionToken(req);
        if (!sessionToken) {
            this.sendErrorResponse(res, 401, '缺少会话令牌');
            return;
        }

        const urlParts = url.parse(req.url, true);
        const page = parseInt(urlParts.query.page) || 1;
        const pageSize = parseInt(urlParts.query.pageSize) || 20;
        const userId = urlParts.query.userId ? parseInt(urlParts.query.userId) : null;

        const result = userAPI.getLogs(sessionToken, page, pageSize, userId);
        this.sendJSONResponse(res, result.success ? 200 : 403, result);
    }

    // 处理API文档
    handleApiDocs(req, res) {
        const docs = {
            title: "用户管理API文档",
            version: "1.0.0",
            baseUrl: `http://localhost:${this.port}/api`,
            endpoints: {
                "POST /api/register": {
                    description: "用户注册",
                    body: {
                        username: "string (required)",
                        email: "string (required)",
                        password: "string (required)",
                        userRole: "string (optional: user|admin|vip)",
                        profileData: "object (optional)"
                    },
                    example: {
                        username: "testuser",
                        email: "test@example.com",
                        password: "password123",
                        profileData: { nickname: "测试用户" }
                    }
                },
                "POST /api/login": {
                    description: "用户登录",
                    body: {
                        username: "string (required)",
                        password: "string (required)",
                        ipAddress: "string (optional)",
                        userAgent: "string (optional)"
                    },
                    example: {
                        username: "testuser",
                        password: "password123"
                    }
                },
                "GET /api/session": {
                    description: "验证会话",
                    headers: {
                        "X-Session-Token": "string (required)"
                    }
                },
                "POST /api/logout": {
                    description: "用户登出",
                    headers: {
                        "X-Session-Token": "string (required)"
                    }
                },
                "PUT /api/users/:id": {
                    description: "更新用户信息",
                    headers: {
                        "X-Session-Token": "string (required)"
                    },
                    body: {
                        email: "string (optional)",
                        userRole: "string (optional, admin only)",
                        profileData: "object (optional)",
                        isActive: "boolean (optional, admin only)"
                    }
                },
                "DELETE /api/users/:id": {
                    description: "删除用户",
                    headers: {
                        "X-Session-Token": "string (required)"
                    }
                },
                "GET /api/users": {
                    description: "获取用户列表 (管理员)",
                    headers: {
                        "X-Session-Token": "string (required)"
                    },
                    query: {
                        page: "number (optional, default: 1)",
                        pageSize: "number (optional, default: 10)"
                    }
                },
                "GET /api/logs": {
                    description: "获取操作日志 (管理员)",
                    headers: {
                        "X-Session-Token": "string (required)"
                    },
                    query: {
                        page: "number (optional, default: 1)",
                        pageSize: "number (optional, default: 20)",
                        userId: "number (optional)"
                    }
                }
            },
            authentication: {
                description: "使用会话令牌进行身份验证",
                header: "X-Session-Token: <token>",
                note: "登录成功后会返回sessionToken，在后续请求中使用"
            }
        };

        this.sendJSONResponse(res, 200, docs);
    }

    // 处理健康检查
    handleHealthCheck(req, res) {
        this.sendJSONResponse(res, 200, {
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: "1.0.0"
        });
    }

    // 路由处理
    async handleRequest(req, res) {
        const urlParts = url.parse(req.url, true);
        const pathname = urlParts.pathname;
        const method = req.method;

        console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

        // 处理OPTIONS请求（CORS预检）
        if (method === 'OPTIONS') {
            this.setCORSHeaders(res);
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            // API路由
            if (pathname === '/api/register' && method === 'POST') {
                await this.handleRegister(req, res);
            } else if (pathname === '/api/login' && method === 'POST') {
                await this.handleLogin(req, res);
            } else if (pathname === '/api/session' && method === 'GET') {
                this.handleValidateSession(req, res);
            } else if (pathname === '/api/logout' && method === 'POST') {
                this.handleLogout(req, res);
            } else if (pathname.match(/^\/api\/users\/(\d+)$/) && method === 'PUT') {
                const userId = pathname.match(/^\/api\/users\/(\d+)$/)[1];
                await this.handleUpdateUser(req, res, userId);
            } else if (pathname.match(/^\/api\/users\/(\d+)$/) && method === 'DELETE') {
                const userId = pathname.match(/^\/api\/users\/(\d+)$/)[1];
                this.handleDeleteUser(req, res, userId);
            } else if (pathname === '/api/users' && method === 'GET') {
                this.handleGetUserList(req, res);
            } else if (pathname === '/api/logs' && method === 'GET') {
                this.handleGetLogs(req, res);
            } else if (pathname === '/api/docs' && method === 'GET') {
                this.handleApiDocs(req, res);
            } else if (pathname === '/health' && method === 'GET') {
                this.handleHealthCheck(req, res);
            } else if (pathname === '/' && method === 'GET') {
                // 根路径重定向到API文档
                res.writeHead(302, { 'Location': '/api/docs' });
                res.end();
            } else {
                this.sendErrorResponse(res, 404, '接口不存在');
            }
        } catch (error) {
            console.error('请求处理错误:', error);
            this.sendErrorResponse(res, 500, '服务器内部错误');
        }
    }

    // 启动服务器
    start() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 用户管理Web服务器启动成功！`);
            console.log(`📡 服务地址: http://localhost:${this.port}`);
            console.log(`📖 API文档: http://localhost:${this.port}/api/docs`);
            console.log(`💚 健康检查: http://localhost:${this.port}/health`);
            console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
        });

        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n🛑 正在关闭服务器...');
            this.server.close(() => {
                console.log('✅ 服务器已关闭');
                process.exit(0);
            });
        });
    }
}

// 启动服务器
const port = process.env.PORT || 3000;
const webServer = new UserManagementWebServer(port);
webServer.start();

export default UserManagementWebServer;