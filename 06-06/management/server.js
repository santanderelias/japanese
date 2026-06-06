const http = require('http');
const fs = require('fs');
const path = require('path');
const apiHandlers = require('./apiHandlers');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ogg': 'audio/ogg'
};

function serveStatic(res, filePath) {
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // API Routes
    if (pathname.startsWith('/api/')) {
        return apiHandlers.handle(req, res);
    }

    // Determine file path
    let filePath;
    if (pathname.startsWith('/vendor/') || pathname.startsWith('/assets/') || pathname === '/favicon.svg') {
        // These are in the root directory
        filePath = path.join(__dirname, '..', pathname);
    } else {
        // Management UI files
        filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'admin.html' : pathname);
    }
    
    serveStatic(res, filePath);
});

function start() {
    server.listen(PORT, () => {
        console.log(`Management server running at http://localhost:${PORT}`);
    });
}

module.exports = { start };
