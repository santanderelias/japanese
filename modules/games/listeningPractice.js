import { recordAnswer } from '../statsTracker.js';

let allCards = [];
let currentCard = null;
let score = 0;
let totalPlayed = 0;

export async function initListeningGame() {
    const response = await fetch('data.json');
    const data = await response.json();
    // Filter cards that have audio
    allCards = data.filter(c => c.audio);
    startNewRound();
}

function startNewRound() {
    if (allCards.length < 4) return;

    currentCard = allCards[Math.floor(Math.random() * allCards.length)];

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
    return meaning.replace(/^\(.*?\)\s*/, '');
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
        score++;
    } else {
        btn.classList.add('wrong');
        document.querySelector(`.listening-option[data-id="${currentCard.id}"]`).classList.add('correct');
    }

    totalPlayed++;

    setTimeout(() => {
        startNewRound();
    }, 1500);
}

window.startListeningGame = initListeningGame;
