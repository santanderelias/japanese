const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = __dirname;
const SRC_DIR = path.dirname(BUILD_DIR);
const ASSETS_DIR = path.join(SRC_DIR, 'assets');
const CARDS_DIR = path.join(SRC_DIR, 'cards');

const args = process.argv.slice(2);
const noCache = args.includes('--no-cache');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(CARDS_DIR)) fs.mkdirSync(CARDS_DIR, { recursive: true });

async function build() {
    console.log('--- Starting Build Pipeline ---');
    if (noCache) console.log('Flag detected: --no-cache. Performing clean build.');

    // Cleanup Logic
    if (noCache) {
        console.log('Cleaning all modules and assets...');
        const cardFiles = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.js'));
        cardFiles.forEach(f => fs.unlinkSync(path.join(CARDS_DIR, f)));
        // Note: We don't delete assets/ automatically unless we have a source to re-download from.
    }

    // 1. Convert Anki to JSON
    console.log('Step 1: Converting Anki export to data.json...');
    execSync(`node ${path.join(BUILD_DIR, 'anki2json.js')}`, { stdio: 'inherit' });

    // 2. Generate Card Modules
    console.log('\nStep 2: Generating individual card modules from data.json...');
    const cacheFlag = noCache ? ' --no-cache' : '';
    execSync(`node ${path.join(BUILD_DIR, 'generateCards.js')}${cacheFlag}`, { stdio: 'inherit' });

    // 3. Asset Management & Data Sanitization
    console.log('\nStep 3: Verifying assets and sanitizing data.json...');
    const cards = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'data.json'), 'utf8'));
    
    const sanitizedCards = cards.map(card => {
        let finalImage = 'not-found.svg';
        if (card.image && card.image !== 'not-found.svg') {
            const imagePath = path.join(ASSETS_DIR, card.image);
            if (fs.existsSync(imagePath)) {
                finalImage = card.image;
            } else {
                console.warn(`[Warning] Image not found for card ${card.id}: ${card.image}. Falling back to not-found.svg`);
            }
        }

        let finalAudio = '';
        if (card.audio) {
            const audioPath = path.join(ASSETS_DIR, card.audio);
            if (fs.existsSync(audioPath)) {
                finalAudio = card.audio;
            } else {
                console.warn(`[Warning] Audio not found for card ${card.id}: ${card.audio}.`);
            }
        }

        return { ...card, image: finalImage, audio: finalAudio };
    });

    // Write the verified data back to data.json for the frontend (card.html)
    fs.writeFileSync(path.join(SRC_DIR, 'data.json'), JSON.stringify(sanitizedCards, null, 2));

    // 4. Compile index.html
    console.log('\nStep 4: Compiling index.html...');
    const cardFiles = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.js'));
    
    const cardModules = cardFiles.map(f => {
        const modPath = path.join(CARDS_DIR, f);
        const mod = require(modPath);
        delete require.cache[require.resolve(modPath)];
        return mod;
    }).sort((a, b) => a.id - b.id);

    const cardsHtml = cardModules.map(card => {
        return `
        <div class="thumb" onclick="window.location.href='card.html?id=${card.id}'">
            ${card.kanji || card.reading || ''}
        </div>
    `;
    }).join('');

    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Renshuu</title>
    <link rel="stylesheet" href="main.css">
</head>
<body>
    <header class="header">
        <div class="gear-btn" id="gear">⚙️</div>
        <div id="menu" class="settings-menu hidden">
            <button id="theme">Toggle Theme</button>
            <button id="clear">Clear Storage</button>
        </div>
    </header>
    <main class="gallery" id="gallery">${cardsHtml}</main>
    
    <script>
        const theme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        
        document.getElementById('theme').onclick = () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        };
        
        document.getElementById('clear').onclick = () => { localStorage.clear(); location.reload(); };
        document.getElementById('gear').onclick = () => document.getElementById('menu').classList.toggle('hidden');
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(SRC_DIR, 'index.html'), html);
    console.log('Build successful!');
}

function checkAsset(filename) {
    const filePath = path.join(ASSETS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        // Placeholder for download logic
    }
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
