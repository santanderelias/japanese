const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data.json');
const SW_PATH = path.join(__dirname, '../sw.js');
const ASSETS_DIR = path.join(__dirname, '../assets');

function readData() {
    try {
        const content = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(content);
    } catch (err) {
        console.error('Error reading data.json:', err);
        return [];
    }
}

function writeData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    updateServiceWorker();
}

function updateServiceWorker() {
    try {
        let swContent = fs.readFileSync(SW_PATH, 'utf8');
        
        // 1. Bump Cache Name
        swContent = swContent.replace(/const CACHE_NAME = 'renshu-cards-v(\d+)';/, (match, version) => {
            return `const CACHE_NAME = 'renshu-cards-v${parseInt(version) + 1}';`;
        });

        // 2. Update ASSETS array
        const cards = readData();
        const assetFiles = fs.readdirSync(ASSETS_DIR);
        
        const coreAssets = [
            '/',
            '/index.html',
            '/index.css',
            '/index.js',
            '/data.json',
            '/vendor/bootstrap.min.css',
            '/vendor/bootstrap.bundle.min.js',
            '/modules/card.js',
            '/modules/notifications.js',
            '/modules/renderCard.js',
            '/favicon.svg',
            '/icon-192.svg',
            '/icon-512.svg'
        ];

        const allAssets = [...coreAssets, ...assetFiles.map(f => `/assets/${f}`)];
        
        const assetsString = `const ASSETS = [\n  '${allAssets.join("',\n  '")}'\n];`;
        
        swContent = swContent.replace(/const ASSETS = \[[\s\S]*?\];/, assetsString);
        
        fs.writeFileSync(SW_PATH, swContent, 'utf8');
        console.log('sw.js updated with new assets and bumped version.');
    } catch (err) {
        console.error('Error updating sw.js:', err);
    }
}

function saveAsset(filename, buffer) {
    const filePath = path.join(ASSETS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    updateServiceWorker();
    return filename;
}

module.exports = {
    readData,
    writeData,
    saveAsset,
    ASSETS_DIR
};
