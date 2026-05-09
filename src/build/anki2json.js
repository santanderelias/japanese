const fs = require('fs');
const path = require('path');

const SRC_DIR = path.dirname(__dirname); // parent of 'build'
const DATA_DIR = path.join(SRC_DIR, 'data');
const ANKI_FILE = path.join(DATA_DIR, 'Renshuu.txt');
const DATA_JSON = path.join(SRC_DIR, 'data.json');

function parseAnki() {
    console.log('Parsing Anki export...');
    if (!fs.existsSync(ANKI_FILE)) {
        console.error(`Anki file not found at ${ANKI_FILE}`);
        return;
    }
    const content = fs.readFileSync(ANKI_FILE, 'utf8');
    const lines = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"') {
            if (i + 1 < content.length && content[i+1] === '"') {
                currentLine += char;
                currentLine += content[i+1];
                i++;
                continue;
            }
            inQuotes = !inQuotes;
            currentLine += char;
        } else if (char === '\n' && !inQuotes) {
            lines.push(currentLine);
            currentLine = '';
        } else {
            currentLine += char;
        }
    }
    if (currentLine) lines.push(currentLine);

    const filteredLines = lines.filter(line => line.trim() && !line.startsWith('#'));
    const cards = filteredLines.map((line, index) => {
        const parts = line.split('\t');
        if (parts.length < 2) return null;

        const front = parts[0].replace(/^"|"$/g, '').replace(/""/g, '"');
        const back = parts[1].replace(/^"|"$/g, '').replace(/""/g, '"');

        const readingMatch = front.match(/color: gray;">(.*?)<\/div>/);
        const kanjiMatch = front.match(/font-size: 35px;">(.*?)<\/div>/);
        const audioMatch = front.match(/\[sound:(.*?)\]/);
        const sentenceMatch = front.match(/margin-top: 15px; font-size: 20px;">(.*?)<\/div>/);
        const imgMatch = front.match(/<img.*?src="(.*?)"/);
        const meaningMatch = back.match(/font-weight: bold;">(.*?)<\/div>/);
        const englishSentenceMatch = back.match(/font-size: 18px;">(.*?)<\/div>/);

        const image = imgMatch ? imgMatch[1].trim() : '';
        const audio = audioMatch ? audioMatch[1].trim() : '';

        return {
            id: index + 1,
            reading: readingMatch ? readingMatch[1] : '',
            kanji: kanjiMatch ? kanjiMatch[1] : '',
            audio: audio,
            sentence: sentenceMatch ? sentenceMatch[1] : '',
            englishSentence: englishSentenceMatch ? englishSentenceMatch[1] : '',
            image: image,
            meaning: meaningMatch ? meaningMatch[1] : ''
        };
    }).filter(c => c && (c.kanji || c.reading));

    fs.writeFileSync(DATA_JSON, JSON.stringify(cards, null, 2));
    console.log(`Successfully created ${DATA_JSON} with ${cards.length} cards.`);
}

parseAnki();
