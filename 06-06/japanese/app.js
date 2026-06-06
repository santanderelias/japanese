const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_DIR = path.join(__dirname, 'static');

const server = http.createServer((req, res) => {
    // Remove leading slash to correctly join with STATIC_DIR
    const requestedPath = req.url.split('?')[0].substring(1) || 'index.html';
    let filePath = path.join(STATIC_DIR, requestedPath);

    // Prevent directory traversal
    if (!filePath.startsWith(STATIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ogg': 'audio/ogg',
            '.mp3': 'audio/mpeg'
        }[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
