import { recordAnswer } from '../statsTracker.js';

let allCards = [];
let currentCard = null;
let score = 0;
let totalPlayed = 0;

export async function initMeaningGame() {
    const response = await fetch('data.json');
    allCards = await response.json();
    startNewRound();
}

function startNewRound() {
    if (allCards.length < 4) return;

    // Pick a random card for the question
    currentCard = allCards[Math.floor(Math.random() * allCards.length)];

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
            <div class="game-question-text">${currentCard.kanji}</div>
            <div class="game-question-subtext">${currentCard.reading}</div>
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
    container.querySelectorAll('.game-option-btn').forEach(btn => {
        btn.addEventListener('click', handleOptionClick);
    });
}

function cleanMeaning(meaning) {
    // Remove (Adjective/-な) etc. for cleaner display in buttons
    return meaning.replace(/^\(.*?\)\s*/, '');
}

function handleOptionClick(e) {
    const btn = e.currentTarget;
    const selectedId = parseInt(btn.dataset.id);
    const isCorrect = selectedId === currentCard.id;

    // Record statistics
    recordAnswer(currentCard.id, isCorrect);

    // Disable all buttons to prevent multiple clicks
    document.querySelectorAll('.game-option-btn').forEach(b => b.style.pointerEvents = 'none');

    if (isCorrect) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        // Highlight the correct one
        document.querySelector(`.game-option-btn[data-id="${currentCard.id}"]`).classList.add('correct');
    }

    totalPlayed++;

    // Wait and start next round
    setTimeout(() => {
        startNewRound();
    }, 1500);
}

window.startMeaningGame = initMeaningGame;
