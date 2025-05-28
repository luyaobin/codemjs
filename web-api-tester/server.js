const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    // 处理根路径，返回index.html
    if (pathname === '/' || pathname === '/index.html') {
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // 处理其他静态资源请求
    if (pathname.match(/\.(css|js|ico|png|jpg|jpeg|gif|svg)$/)) {
        const filePath = path.join(__dirname, pathname);
        const ext = path.extname(pathname).toLowerCase();
        const contentType = {
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.ico': 'image/x-icon',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
        return;
    }

    // 404 for all other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
});

// 启动服务器
server.listen(PORT, () => {
    console.log(`Web API 测试工具已启动`);
    console.log(`请访问: http://localhost:${PORT}`);
    console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});