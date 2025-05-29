const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = 3000;

// 模拟用户数据库
const users = {
    'admin': {
        password: 'admin123',
        role: 'admin',
        name: '管理员'
    },
    'user': {
        password: 'user123',
        role: 'user',
        name: '普通用户'
    }
};

// 存储活跃的会话
const sessions = new Map();

// 生成token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// 验证token
function validateToken(token) {
    if (!token) return null;
    
    const session = sessions.get(token);
    if (!session) return null;
    
    // 检查是否过期
    if (session.expiry < Date.now()) {
        sessions.delete(token);
        return null;
    }
    
    // 更新活动时间
    session.lastActivity = Date.now();
    return session;
}

// 解析POST请求体
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                resolve(null);
            }
        });
        req.on('error', reject);
    });
}

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    // 设置CORS头（用于API请求）
    if (pathname.startsWith('/api/')) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
    }

    // 处理登录API
    if (pathname === '/api/login' && req.method === 'POST') {
        const body = await parseBody(req);
        
        if (!body || !body.username || !body.password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: '请提供用户名和密码' }));
            return;
        }
        
        const user = users[body.username];
        if (!user || user.password !== body.password) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: '用户名或密码错误' }));
            return;
        }
        
        // 生成token
        const token = generateToken();
        const expiry = body.remember ? 
            Date.now() + (7 * 24 * 60 * 60 * 1000) : // 7天
            Date.now() + (24 * 60 * 60 * 1000); // 1天
        
        // 保存会话
        sessions.set(token, {
            username: body.username,
            user: {
                username: body.username,
                role: user.role,
                name: user.name
            },
            expiry: expiry,
            lastActivity: Date.now()
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            token: token,
            user: {
                username: body.username,
                role: user.role,
                name: user.name
            }
        }));
        return;
    }

    // 处理登出API
    if (pathname === '/api/logout' && req.method === 'POST') {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? 
            authHeader.substring(7) : null;
        
        if (token && sessions.has(token)) {
            sessions.delete(token);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // 处理验证API
    if (pathname === '/api/verify' && req.method === 'GET') {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? 
            authHeader.substring(7) : null;
        
        const session = validateToken(token);
        
        if (session) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                user: session.user
            }));
        } else {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: false,
                message: '未认证或会话已过期'
            }));
        }
        return;
    }

    // 处理静态文件
    let filePath;
    if (pathname === '/') {
        // 根路径默认提供index.html
        filePath = path.join(__dirname, 'index.html');
    } else {
        filePath = path.join(__dirname, pathname);
    }

    // 安全检查：确保请求的文件在当前目录内
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // 获取文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream';

    // 读取并发送文件
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`Web API 测试工具已启动`);
    console.log(`请访问: http://localhost:${PORT}`);
    console.log('');
    console.log('默认账号：');
    console.log('  管理员: admin / admin123');
    console.log('  普通用户: user / user123');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
});

// 定期清理过期会话
setInterval(() => {
    const now = Date.now();
    for (const [token, session] of sessions.entries()) {
        if (session.expiry < now) {
            sessions.delete(token);
        }
    }
}, 60 * 60 * 1000); // 每小时清理一次

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});