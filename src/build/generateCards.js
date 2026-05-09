const fs = require('fs');
const path = require('path');

const SRC_DIR = path.dirname(__dirname);
const DATA_JSON = path.join(SRC_DIR, 'data.json');
const ASSETS_DIR = path.join(SRC_DIR, 'assets');

const args = process.argv.slice(2);
const noCache = args.includes('--no-cache');

function generate() {
    console.log('Generating individual card modules...');
    if (!fs.existsSync(DATA_JSON)) {
        console.error('data.json not found! Run anki2json.js first.');
        return;
    }

    const cards = JSON.parse(fs.readFileSync(DATA_JSON, 'utf8'));
    let generatedCount = 0;
    let skippedCount = 0;

    cards.forEach(card => {
        const filePath = path.join(SRC_DIR, 'cards', `${card.id}.js`);

        if (!noCache && fs.existsSync(filePath)) {
            skippedCount++;
            return;
        }

        // Verify image exists, otherwise use fallback
        let finalImage = 'not-found.svg';
        if (card.image && card.image !== 'not-found.svg') {
            const imagePath = path.join(ASSETS_DIR, card.image);
            if (fs.existsSync(imagePath)) {
                finalImage = card.image;
            } else {
                console.warn(`[Warning] Image not found for card ${card.id}: ${card.image}. Using not-found.svg`);
            }
        }

        // Verify audio exists
        let finalAudio = '';
        if (card.audio) {
            const audioPath = path.join(ASSETS_DIR, card.audio);
            if (fs.existsSync(audioPath)) {
                finalAudio = card.audio;
            } else {
                console.warn(`[Warning] Audio not found for card ${card.id}: ${card.audio}.`);
            }
        }

        const safeString = (str) => (str || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

        const jsContent = `module.exports = {
        id: ${card.id},
        reading: "${safeString(card.reading)}",
        kanji: "${safeString(card.kanji)}",
        sentence: "${safeString(card.sentence)}",
        englishSentence: "${safeString(card.englishSentence)}",
        meaning: "${safeString(card.meaning)}",
        image: "${safeString(finalImage)}",
        audio: "${safeString(finalAudio)}"
        };`;
        fs.writeFileSync(filePath, jsContent);
        generatedCount++;
    });

    console.log(`Finished: ${generatedCount} generated, ${skippedCount} skipped. Cards in ${SRC_DIR}/cards.`);
}


generate();
