const fileSystem = require('./fileSystem');
const url = require('url');
const https = require('https');

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

    else if (parsedUrl.pathname === '/api/version' && method === 'GET') {
        const version = fileSystem.getVersion();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ version }));
    }

    else if (parsedUrl.pathname === '/api/version' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { version } = JSON.parse(body);
                fileSystem.writeVersion(version);
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

    else if (parsedUrl.pathname === '/api/tts' && method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { text } = JSON.parse(body);
                const filename = await generateTTS(text);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ filename }));
            } catch (err) {
                res.writeHead(500);
                res.end('TTS Error');
            }
        });
    }

    else {
        res.writeHead(404);
        res.end('Not Found');
    }
}

async function generateTTS(text) {
    const encodedText = encodeURIComponent(text);
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ja&client=tw-ob`;
    
    return new Promise((resolve, reject) => {
        https.get(ttsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const filename = `audio_${Date.now()}.mp3`;
                fileSystem.saveAsset(filename, buffer);
                resolve(filename);
            });
        }).on('error', reject);
    });
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
        let fileBuffer = null;
        let fileType = ''; // 'image' or 'audio'

        for (let part of parts) {
            if (part.includes('filename=')) {
                const headerEnd = part.indexOf('\r\n\r\n');
                const header = part.slice(0, headerEnd).toString();
                fileBuffer = part.slice(headerEnd + 4, part.lastIndexOf('\r\n'));

                if (header.includes('image/')) fileType = 'img';
                else if (header.includes('audio/')) fileType = 'audio';
            }
        }

        if (fileBuffer && fileType) {
            // Determine extension from MIME type
            const mimeType = buffer.toString().match(/(image|audio)\/([a-zA-Z0-9]+)/);
            const ext = mimeType ? (mimeType[2] === 'jpeg' ? 'jpg' : mimeType[2]) : 'bin';
            const filename = `${fileType}_${Date.now()}.${ext}`;

            fileSystem.saveAsset(filename, fileBuffer);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ filename }));
        } else {
            res.writeHead(400);
            res.end('Unsupported file or no file uploaded');
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
