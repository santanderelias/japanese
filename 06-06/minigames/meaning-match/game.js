import { recordAnswer, getStats } from '../../modules/statsTracker.js';

class MeaningMatch {
    constructor(rootId) {
        this.root = document.getElementById(rootId);
        this.allCards = [];
        this.currentCard = null;
        this.lastWordId = null;
        this.isRevealed = false;

        this.injectHTML();
    }

    injectHTML() {
        this.root.innerHTML = `
            <div class="mm_game">
                <div class="game-container">
                    <div id="mm-game-content">
                        <!-- Game content rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    init(data) {
        this.allCards = data ? data.filter(c => !c.hidden) : [];
        if (this.allCards.length < 4) {
            this.root.querySelector('#mm-game-content').innerHTML = '<div class="alert alert-warning">Need at least 4 cards to play.</div>';
            return;
        }
        this.startNewRound();
    }

    startNewRound() {
        if (this.allCards.length < 4) return;

        const stats = getStats();
        const now = Date.now();
        
        // SRS Selection
        let dueCards = this.allCards.filter(card => {
            const wordStats = stats.words[String(card.id)];
            return (!wordStats || !wordStats.dueDate || wordStats.dueDate <= now) && card.id !== this.lastWordId;
        });

        dueCards.sort(() => Math.random() - 0.5);

        if (dueCards.length === 0) {
            dueCards = this.allCards
                .filter(c => c.id !== this.lastWordId)
                .sort((a, b) => {
                    const sA = stats.words[String(a.id)] || { lastSeen: 0 };
                    const sB = stats.words[String(b.id)] || { lastSeen: 0 };
                    return sA.lastSeen - sB.lastSeen;
                });
        }

        this.currentCard = dueCards[0];
        this.lastWordId = this.currentCard.id;
        this.isRevealed = false;

        let options = [this.currentCard];
        while (options.length < 4) {
            const randomCard = this.allCards[Math.floor(Math.random() * this.allCards.length)];
            if (!options.find(o => o.id === randomCard.id)) {
                options.push(randomCard);
            }
        }

        options.sort(() => Math.random() - 0.5);

        this.renderGame(options);
    }

    renderGame(options) {
        const container = this.root.querySelector('#mm-game-content');
        container.innerHTML = `
            <div class="game-question-card mt-2">
                <button class="hint-audio-btn" id="mm-play-audio" title="Play Audio">🔊</button>
                <div class="game-question-text" id="mm-question-text">${this.currentCard.kanji}</div>
                <div class="game-question-subtext" id="mm-question-subtext">${this.currentCard.reading}</div>
            </div>
            <div class="game-options-grid mt-4">
                ${options.map(opt => `
                    <button class="game-option-btn mm-option" data-id="${opt.id}">
                        ${this.cleanMeaning(opt.meaning)}
                    </button>
                `).join('')}
            </div>
            <div id="mm-feedback" class="mt-3 fw-bold fs-5" style="min-height: 1.5em;"></div>
        `;

        this.root.querySelector('#mm-play-audio').addEventListener('click', (e) => {
            e.stopPropagation();
            this.playCurrentAudio();
        });

        this.root.querySelector('#mm-question-text').addEventListener('click', () => {
            this.toggleReveal();
        });

        container.querySelectorAll('.mm-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e));
        });
    }

    toggleReveal() {
        this.isRevealed = !this.isRevealed;
        const subtext = this.root.querySelector('#mm-question-subtext');
        if (this.isRevealed) {
            subtext.classList.add('visible');
        } else {
            subtext.classList.remove('visible');
        }
    }

    playCurrentAudio() {
        if (this.currentCard && this.currentCard.audio) {
            if (window.playAudio) {
                window.playAudio(`assets/${this.currentCard.audio}`);
            } else {
                new Audio(`assets/${this.currentCard.audio}`).play().catch(e => console.error(e));
            }
        }
    }

    cleanMeaning(meaning) {
        return meaning.replace(/^\(.*?\)\s*/, '').replace(/\d+\.\s*/g, '').trim();
    }

    handleOptionClick(e) {
        const btn = e.currentTarget;
        const selectedId = parseInt(btn.dataset.id);
        const isCorrect = selectedId === this.currentCard.id;
        const feedback = this.root.querySelector('#mm-feedback');

        recordAnswer(this.currentCard.id, isCorrect);

        this.root.querySelectorAll('.mm-option').forEach(b => b.style.pointerEvents = 'none');

        if (isCorrect) {
            btn.classList.add('correct');
            feedback.textContent = "Correct!";
            feedback.className = "mt-3 fw-bold fs-5 correct-feedback";
        } else {
            btn.classList.add('wrong');
            this.root.querySelector(`.mm-option[data-id="${this.currentCard.id}"]`).classList.add('correct');
            feedback.textContent = `Wrong! It was: ${this.cleanMeaning(this.currentCard.meaning)}`;
            feedback.className = "mt-3 fw-bold fs-5 wrong-feedback";
        }

        // Auto reveal reading on answer
        this.root.querySelector('#mm-question-subtext').classList.add('visible');

        setTimeout(() => {
            this.startNewRound();
        }, 2000);
    }

    stopGame() {
        // Cleanup
    }
}

window.MeaningMatch = MeaningMatch;
