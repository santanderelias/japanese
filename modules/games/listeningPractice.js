import { recordAnswer, getStats } from '../statsTracker.js';

let allCards = [];
let currentCard = null;
let lastWordId = null;

export function initListeningGame(data) {
    // Filter cards that have audio AND are not hidden
    allCards = data ? data.filter(c => c.audio && !c.hidden) : [];
    startNewRound();
}

function startNewRound() {
    if (allCards.length < 4) return;

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

    let options = [currentCard];
    while (options.length < 4) {
        const randomCard = allCards[Math.floor(Math.random() * allCards.length)];
        if (!options.find(o => o.id === randomCard.id)) {
            options.push(randomCard);
        }
    }

    options.sort(() => Math.random() - 0.5);

    renderGame(options);
    playCurrentAudio();
}

function playCurrentAudio() {
    if (currentCard && currentCard.audio) {
        window.playAudio(`assets/${currentCard.audio}`);
    }
}

function renderGame(options) {
    const container = document.getElementById('listening-game-container');
    container.innerHTML = `
        <div class="game-question-card mt-2">
            <button class="play-audio-btn-large" id="play-listening-audio" title="Play Audio">
                🔊
            </button>
            <div class="mt-2 text-muted small">Tap to hear</div>
        </div>
        <div class="game-options-grid">
            ${options.map(opt => `
                <button class="game-option-btn listening-option" data-id="${opt.id}">
                    <div class="fw-bold fs-5">${opt.kanji}</div>
                    <div class="small opacity-75" style="font-size: 0.85rem;">${cleanMeaning(opt.meaning)}</div>
                </button>
            `).join('')}
        </div>
    `;

    document.getElementById('play-listening-audio').addEventListener('click', playCurrentAudio);

    container.querySelectorAll('.listening-option').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });
}

function cleanMeaning(meaning) {
    // 1. Remove (Adjective/-な) etc.
    let cleaned = meaning.replace(/^\(.*?\)\s*/, '');
    // 2. Remove numbers like "1. ", "2. "
    cleaned = cleaned.replace(/\d+\.\s*/g, '');
    return cleaned.trim();
}

function handleOptionClick(e) {
    const btn = e.currentTarget;
    const selectedId = parseInt(btn.dataset.id);
    const isCorrect = selectedId === currentCard.id;

    // Record statistics
    recordAnswer(currentCard.id, isCorrect);

    document.querySelectorAll('.listening-option').forEach(b => b.style.pointerEvents = 'none');

    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('wrong');
        document.querySelector(`.listening-option[data-id="${currentCard.id}"]`).classList.add('correct');
    }

    setTimeout(() => {
        startNewRound();
    }, 1500);
}

window.startListeningGame = initListeningGame;
