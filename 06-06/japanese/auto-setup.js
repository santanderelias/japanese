const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'static', 'data.json');
const ASSETS_DIR = path.join(__dirname, 'static', 'assets');

async function checkAssets() {
    console.log('--- Renshu Cards Asset Validator ---');
    
    if (!fs.existsSync(DATA_FILE)) {
        console.error('Error: static/data.json not found.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let missingCount = 0;

    data.forEach(card => {
        const imagePath = card.image ? path.join(ASSETS_DIR, card.image) : null;
        const audioPath = card.audio ? path.join(ASSETS_DIR, card.audio) : null;

        if (imagePath && !fs.existsSync(imagePath)) {
            console.log(`[Pending] Image missing for ID ${card.id}: ${card.image}`);
            missingCount++;
        }

        if (audioPath && !fs.existsSync(audioPath)) {
            console.log(`[Pending] Audio missing for ID ${card.id}: ${card.audio}`);
            missingCount++;
        }
    });

    if (missingCount === 0) {
        console.log('All assets verified successfully!');
    } else {
        console.log(`\nTotal missing assets: ${missingCount}`);
    }
}

checkAssets();
