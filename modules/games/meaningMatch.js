import { recordAnswer, getStats } from '../statsTracker.js';

let allCards = [];
let currentCard = null;
let lastWordId = null;
let hintUsedInRound = false;

export function initMeaningGame(data) {
    allCards = data ? data.filter(c => !c.hidden) : [];
    startNewRound();
}

function startNewRound() {
    if (allCards.length < 4) return;
    hintUsedInRound = false;

    // SRS Selection Logic
    const stats = getStats();
    const now = Date.now();
    
    // 1. Find cards that are due
    let dueCards = allCards.filter(card => {
        const wordStats = stats.words[String(card.id)];
        return (!wordStats || !wordStats.dueDate || wordStats.dueDate <= now) && card.id !== lastWordId;
    });

    // Shuffle due cards to avoid index-based ordering
    dueCards.sort(() => Math.random() - 0.5);

    // 2. If nothing due, pick cards with oldest lastSeen or never seen
    if (dueCards.length === 0) {
        dueCards = allCards
            .filter(c => c.id !== lastWordId)
            .sort((a, b) => {
                const sA = stats.words[String(a.id)] || { lastSeen: 0 };
                const sB = stats.words[String(b.id)] || { lastSeen: 0 };
                return sA.lastSeen - sB.lastSeen;
            });
    }

    // Pick the most urgent card
    currentCard = dueCards[0];
    lastWordId = currentCard.id;

    // Pick 3 random wrong answers
    let options = [currentCard];
    while (options.length < 4) {
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        if (!options.find(o => o.id === randomCard.id)) {
            options.push(randomCard);
        }
    }

    // Shuffle options
    options.sort(() => Math.random() - 0.5);

    renderGame(options);
}

function renderGame(options) {
    const container = document.getElementById('meaning-game-container');
    container.innerHTML = `
        <div class="game-question-card mt-2">
            <button class="hint-audio-btn" id="hint-audio" title="Hear word">🔊</button>
            <div class="game-question-text" id="kanji-hint-trigger">${currentCard.kanji}</div>
            <div class="game-question-subtext" id="reading-hint">${currentCard.reading}</div>
        </div>
        <div class="game-options-grid">
            ${options.map(opt => `
                <button class="game-option-btn" data-id="${opt.id}">
                    ${cleanMeaning(opt.meaning)}
                </button>
            `).join('')}
        </div>
    `;

    // Add event listeners
    document.getElementById('hint-audio').addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.playAudio && currentCard.audio) {
            window.playAudio(`assets/${currentCard.audio}`);
        }
    });

    document.getElementById('kanji-hint-trigger').addEventListener('click', () => {
        document.getElementById('reading-hint').classList.toggle('visible');
        hintUsedInRound = true;
    });

    container.querySelectorAll('.game-option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });
}

function cleanMeaning(meaning) {
    // 1. Remove (Adjective/-な) etc.
    let cleaned = meaning.replace(/^\(.*?\)\s*/, '');
    // 2. Remove numbers like "1. ", "2. "
    cleaned = cleaned.replace(/\d+\.\s*/g, '');
    // 3. Remove extra semicolons or spaces that might remain
    return cleaned.trim();
}

function handleOptionClick(e) {
    const btn = e.currentTarget;
    const selectedId = parseInt(btn.dataset.id);
    const isCorrect = selectedId === currentCard.id;

    // Record statistics with weight (0.5 if reading hint used)
    const weight = (isCorrect && hintUsedInRound) ? 0.5 : 1.0;
    recordAnswer(currentCard.id, isCorrect, weight);

    // Disable all buttons to prevent multiple clicks
    document.querySelectorAll('.game-option-btn').forEach(b => b.style.pointerEvents = 'none');

    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('wrong');
        // Highlight the correct one
        document.querySelector(`.game-option-btn[data-id="${currentCard.id}"]`).classList.add('correct');
    }

    // Wait and start next round
    setTimeout(() => {
        startNewRound();
    }, 1500);
}

window.startMeaningGame = initMeaningGame;
