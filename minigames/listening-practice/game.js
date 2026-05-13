import { recordAnswer, getStats } from '../../modules/statsTracker.js';

class ListeningPractice {
    constructor(rootId) {
        this.root = document.getElementById(rootId);
        this.allCards = [];
        this.currentCard = null;
        this.lastWordId = null;
        
        this.injectHTML();
    }

    injectHTML() {
        this.root.innerHTML = `
            <div class="lp_game">
                <div class="lp_game-container">
                    <div id="lp-game-content">
                        <!-- Game content rendered here -->
                    </div>
                </div>
            </div>
        `;
    }

    init(data) {
        // Filter cards that have audio AND are not hidden
        this.allCards = data ? data.filter(c => c.audio && !c.hidden) : [];
        if (this.allCards.length < 4) {
            this.root.querySelector('#lp-game-content').innerHTML = '<div class="alert alert-warning">Need at least 4 audio cards to play.</div>';
            return;
        }
        this.startNewRound();
    }

    startNewRound() {
        if (this.allCards.length < 4) return;

        const stats = getStats();
        const now = Date.now();
        
        // SRS Selection Logic
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

        let options = [this.currentCard];
        while (options.length < 4) {
            const randomCard = this.allCards[Math.floor(Math.random() * this.allCards.length)];
            if (!options.find(o => o.id === randomCard.id)) {
                options.push(randomCard);
            }
        }

        options.sort(() => Math.random() - 0.5);

        this.renderGame(options);
        this.playCurrentAudio();
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

    renderGame(options) {
        const container = this.root.querySelector('#lp-game-content');
        container.innerHTML = `
            <div class="lp_game-question-card mt-2 p-4 bg-body-tertiary rounded-4 shadow-sm mb-4">
                <button class="lp_play-audio-btn-large" id="lp-play-audio" title="Play Audio">
                    🔊
                </button>
                <div class="mt-2 text-muted small">Tap to hear</div>
            </div>
            <div class="lp_game-options-grid d-grid gap-3" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                ${options.map(opt => `
                    <button class="lp_game-option-btn lp_listening-option btn py-3" data-id="${opt.id}">
                        <div class="fw-bold fs-5">${opt.kanji}</div>
                        <div class="small opacity-75">${this.cleanMeaning(opt.meaning)}</div>
                    </button>
                `).join('')}
            </div>
        `;

        this.root.querySelector('#lp-play-audio').addEventListener('click', () => this.playCurrentAudio());

        container.querySelectorAll('.lp_listening-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleOptionClick(e));
        });
    }

    cleanMeaning(meaning) {
        return meaning.replace(/^\(.*?\)\s*/, '').replace(/\d+\.\s*/g, '').trim();
    }

    handleOptionClick(e) {
        const btn = e.currentTarget;
        const selectedId = parseInt(btn.dataset.id);
        const isCorrect = selectedId === this.currentCard.id;

        recordAnswer(this.currentCard.id, isCorrect);

        this.root.querySelectorAll('.lp_listening-option').forEach(b => b.style.pointerEvents = 'none');

        if (isCorrect) {
            btn.classList.add('lp_correct');
        } else {
            btn.classList.add('lp_wrong');
            this.root.querySelector(`.lp_listening-option[data-id="${this.currentCard.id}"]`).classList.add('lp_correct');
        }

        setTimeout(() => {
            this.startNewRound();
        }, 1500);
    }

    stopGame() {
        // Cleanup if necessary
    }
}

window.ListeningPractice = ListeningPractice;
