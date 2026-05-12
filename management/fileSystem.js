const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data.json');
const SW_TEMPLATE_PATH = path.join(__dirname, 'cache/sw_template.js');
const SW_PATH = path.join(__dirname, '../sw.js');
const ASSETS_DIR = path.join(__dirname, '../assets');
const VERSION_PATH = path.join(__dirname, '../version.json');

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

function getVersion() {
    try {
        const content = fs.readFileSync(VERSION_PATH, 'utf8');
        return JSON.parse(content).version;
    } catch (e) {
        return '1.0';
    }
}

function updateServiceWorker() {
    try {
        let template = fs.readFileSync(SW_TEMPLATE_PATH, 'utf8');
        const version = getVersion();
        
        // Build asset list
        const assetFiles = fs.readdirSync(ASSETS_DIR)
            .filter(f => /\.(ogg|mp3|png|jpg|jpeg|svg|webp|wav)$/i.test(f)); // Strict filter
        
        const coreAssets = [
            '/', '/index.html', '/index.css', '/index.js', '/data.json',
            '/vendor/bootstrap.min.css', '/vendor/bootstrap.bundle.min.js',
            '/modules/card.js', '/modules/notifications.js', '/modules/renderCard.js',
            '/modules/games/meaningMatch.js', '/modules/games/listeningPractice.js',
            '/modules/statsTracker.js', '/modules/statistics.js',
            '/minigames/tamagotchi/index.html', '/minigames/tamagotchi/style.css',
            '/minigames/tamagotchi/game.js', '/minigames/resolution-race/index.html',
            '/minigames/resolution-race/style.css', '/minigames/resolution-race/game.js'
        ];
        const allAssets = [...coreAssets, ...assetFiles.map(f => `/assets/${f}`)];
        const assetsJson = JSON.stringify(allAssets, null, 2);

        // Populate template
        let swContent = template
            .replace('APP_VERSION_PLACEHOLDER', version)
            .replace('ASSETS_PLACEHOLDER', assetsJson);
            
        fs.writeFileSync(SW_PATH, swContent, 'utf8');
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
    ASSETS_DIR,
    updateServiceWorker
};
