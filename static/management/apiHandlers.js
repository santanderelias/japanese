const fileSystem = require('./fileSystem');
const url = require('url');

function handle(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;

    if (parsedUrl.pathname === '/api/cards' && method === 'GET') {
        const data = fileSystem.readData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    } 
    
    else if (parsedUrl.pathname === '/api/cards' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const newData = JSON.parse(body);
                fileSystem.writeData(newData);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
    }

    else if (parsedUrl.pathname === '/api/upload' && method === 'POST') {
        handleUpload(req, res);
    }

    else {
        res.writeHead(404);
        res.end('Not Found');
    }
}

function handleUpload(req, res) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
        res.writeHead(400);
        return res.end('Unsupported content type');
    }

    const boundary = contentType.split('boundary=')[1];
    let buffer = Buffer.alloc(0);

    req.on('data', chunk => {
        buffer = Buffer.concat([buffer, chunk]);
    });

    req.on('end', () => {
        const parts = buffer.split(Buffer.from('--' + boundary));
        let filename = '';
        let fileBuffer = null;

        for (let part of parts) {
            if (part.includes('filename=')) {
                const headerEnd = part.indexOf('\r\n\r\n');
                const header = part.slice(0, headerEnd).toString();
                const content = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));

                const nameMatch = header.match(/filename="(.+?)"/);
                if (nameMatch) {
                    filename = nameMatch[1];
                    // Ensure unique filename with timestamp
                    const ext = filename.split('.').pop();
                    const type = header.includes('image') ? 'img' : 'audio';
                    filename = `${type}_${Date.now()}.${ext}`;
                    fileBuffer = content;
                }
            }
        }

        if (fileBuffer) {
            fileSystem.saveAsset(filename, fileBuffer);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ filename }));
        } else {
            res.writeHead(400);
            res.end('No file uploaded');
        }
    });
}

// Helper for buffer splitting (since Buffer.prototype.split is not standard in older node versions)
if (!Buffer.prototype.split) {
    Buffer.prototype.split = function(separator) {
        let result = [];
        let start = 0;
        let index;
        while ((index = this.indexOf(separator, start)) !== -1) {
            result.push(this.slice(start, index));
            start = index + separator.length;
        }
        result.push(this.slice(start));
        return result;
    };
}

module.exports = { handle };
