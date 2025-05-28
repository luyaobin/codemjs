import http from 'http';

// Web API客户端测试类
class UserManagementWebClient {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.sessionToken = null;
    }

    // 发送HTTP请求
    async request(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };

            // 添加会话令牌
            if (this.sessionToken) {
                options.headers['X-Session-Token'] = this.sessionToken;
            }

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', chunk => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const result = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: JSON.parse(body)
                        };
                        resolve(result);
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: body
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    // 用户注册
    async register(userData) {
        console.log('📝 测试用户注册...');
        const response = await this.request('POST', '/api/register', userData);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 用户登录
    async login(credentials) {
        console.log('🔐 测试用户登录...');
        const response = await this.request('POST', '/api/login', credentials);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        
        if (response.data.success && response.data.data.sessionToken) {
            this.sessionToken = response.data.data.sessionToken;
            console.log('✅ 会话令牌已保存');
        }
        
        return response;
    }

    // 验证会话
    async validateSession() {
        console.log('🔍 测试会话验证...');
        const response = await this.request('GET', '/api/session');
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 更新用户信息
    async updateUser(userId, updateData) {
        console.log('✏️ 测试用户信息更新...');
        const response = await this.request('PUT', `/api/users/${userId}`, updateData);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 获取用户列表
    async getUserList(page = 1, pageSize = 10) {
        console.log('📋 测试获取用户列表...');
        const response = await this.request('GET', `/api/users?page=${page}&pageSize=${pageSize}`);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 获取操作日志
    async getLogs(page = 1, pageSize = 5) {
        console.log('📊 测试获取操作日志...');
        const response = await this.request('GET', `/api/logs?page=${page}&pageSize=${pageSize}`);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 用户登出
    async logout() {
        console.log('🚪 测试用户登出...');
        const response = await this.request('POST', '/api/logout');
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        
        if (response.data.success) {
            this.sessionToken = null;
            console.log('✅ 会话令牌已清除');
        }
        
        return response;
    }

    // 删除用户
    async deleteUser(userId) {
        console.log('🗑️ 测试删除用户...');
        const response = await this.request('DELETE', `/api/users/${userId}`);
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 获取API文档
    async getApiDocs() {
        console.log('📖 获取API文档...');
        const response = await this.request('GET', '/api/docs');
        console.log(`状态码: ${response.statusCode}`);
        console.log('API文档:', response.data);
        return response;
    }

    // 健康检查
    async healthCheck() {
        console.log('💚 健康检查...');
        const response = await this.request('GET', '/health');
        console.log(`状态码: ${response.statusCode}`);
        console.log('响应:', response.data);
        return response;
    }

    // 运行完整测试
    async runFullTest() {
        console.log('🚀 开始Web API完整测试\n');

        try {
            // 1. 健康检查
            await this.healthCheck();
            console.log('\n' + '='.repeat(50) + '\n');

            // 2. 获取API文档
            await this.getApiDocs();
            console.log('\n' + '='.repeat(50) + '\n');

            // 3. 注册管理员
            await this.register({
                username: 'webadmin',
                email: 'webadmin@example.com',
                password: 'admin123456',
                userRole: 'admin',
                profileData: {
                    nickname: 'Web管理员',
                    department: 'IT部门'
                }
            });
            console.log('\n' + '='.repeat(50) + '\n');

            // 4. 注册普通用户
            await this.register({
                username: 'webuser',
                email: 'webuser@example.com',
                password: 'user123456',
                profileData: {
                    nickname: 'Web用户',
                    age: 25
                }
            });
            console.log('\n' + '='.repeat(50) + '\n');

            // 5. 管理员登录
            await this.login({
                username: 'webadmin',
                password: 'admin123456',
                ipAddress: '127.0.0.1',
                userAgent: 'WebClient/1.0'
            });
            console.log('\n' + '='.repeat(50) + '\n');

            // 6. 验证会话
            await this.validateSession();
            console.log('\n' + '='.repeat(50) + '\n');

            // 7. 更新用户信息
            await this.updateUser(1, {
                profileData: {
                    nickname: '超级Web管理员',
                    department: 'IT部门',
                    phone: '13800138000',
                    lastUpdated: new Date().toISOString()
                }
            });
            console.log('\n' + '='.repeat(50) + '\n');

            // 8. 获取用户列表
            await this.getUserList(1, 10);
            console.log('\n' + '='.repeat(50) + '\n');

            // 9. 获取操作日志
            await this.getLogs(1, 5);
            console.log('\n' + '='.repeat(50) + '\n');

            // 10. 登出
            await this.logout();
            console.log('\n' + '='.repeat(50) + '\n');

            // 11. 登出后验证会话（应该失败）
            await this.validateSession();
            console.log('\n' + '='.repeat(50) + '\n');

            console.log('✅ Web API测试完成！');

        } catch (error) {
            console.error('❌ 测试过程中发生错误:', error);
        }
    }
}

// 等待服务器启动的函数
function waitForServer(url, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        function checkServer() {
            const urlObj = new URL(url);
            const req = http.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: '/health',
                method: 'GET',
                timeout: 1000
            }, (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    setTimeout(checkServer, 500);
                }
            });

            req.on('error', () => {
                if (Date.now() - startTime > timeout) {
                    reject(new Error('服务器启动超时'));
                } else {
                    setTimeout(checkServer, 500);
                }
            });

            req.end();
        }

        checkServer();
    });
}

// 主函数
async function main() {
    const client = new UserManagementWebClient();
    
    console.log('⏳ 等待服务器启动...');
    try {
        await waitForServer('http://localhost:3000');
        console.log('✅ 服务器已就绪\n');
        
        await client.runFullTest();
    } catch (error) {
        console.error('❌ 无法连接到服务器:', error.message);
        console.log('💡 请确保先运行: node web-server.mjs');
    }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default UserManagementWebClient;