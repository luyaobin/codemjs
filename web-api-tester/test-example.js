const http = require('http');

// 创建一个简单的测试API服务器
const apiServer = http.createServer((req, res) => {
    // 设置CORS头，允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // 解析URL
    const url = req.url;
    const method = req.method;
    
    // 路由处理
    if (url === '/api/hello' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Hello, World!',
            timestamp: new Date().toISOString()
        }));
    } else if (url === '/api/echo' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                echo: body,
                method: method,
                headers: req.headers
            }));
        });
    } else if (url.startsWith('/api/users/') && method === 'GET') {
        const userId = url.split('/').pop();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: userId,
            name: `User ${userId}`,
            email: `user${userId}@example.com`
        }));
    } else if (url === '/api/protected' && method === 'GET') {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: 'Access granted',
                token: authHeader.substring(7)
            }));
        }
    } else if (url === '/api/status/500' && method === 'GET') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

// 启动测试API服务器
const API_PORT = 3001;
apiServer.listen(API_PORT, () => {
    console.log(`测试API服务器已启动在端口 ${API_PORT}`);
    console.log('\n可用的测试端点:');
    console.log('  GET  http://localhost:3001/api/hello');
    console.log('  POST http://localhost:3001/api/echo');
    console.log('  GET  http://localhost:3001/api/users/:id');
    console.log('  GET  http://localhost:3001/api/protected (需要Bearer Token)');
    console.log('  GET  http://localhost:3001/api/status/500 (返回500错误)');
    console.log('\n按 Ctrl+C 停止服务器');
});