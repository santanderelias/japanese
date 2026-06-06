/**
 * Resolution Race Minigame Logic
 */

class ResolutionRace {
    constructor(rootId) {
        this.root = document.getElementById(rootId);
        this.allCards = [];
        this.currentCard = null;
        this.score = 0;
        this.timeLeft = 5000; // 5 seconds in ms
        this.timerInterval = null;
        this.startTime = null;
        this.isGameOver = false;
        this.resolveTimeout = null;

        this.injectHTML();
        
        this.elements = {
            image: this.root.querySelector('.race_word-image'),
            input: this.root.querySelector('.race_user-input'),
            score: this.root.querySelector('.race_score-display'),
            timer: this.root.querySelector('.race_timer-bar-fill'),
            feedback: this.root.querySelector('.race_feedback-msg'),
            playBtn: this.root.querySelector('.race_play-audio-btn'),
            startScreen: this.root.querySelector('.race_start-screen'),
            startBtn: this.root.querySelector('.race_start-btn')
        };

        this.bindEvents();
    }

    injectHTML() {
        this.root.innerHTML = `
            <div class="race_game">
                <div class="race_container">
                    <div class="race_score-display mb-3 fw-bold">Score: 0</div>
                    
                    <div class="race_start-screen text-center py-5">
                        <h2>Resolution Race</h2>
                        <p>Type the reading, kanji, or meaning before the image unblurs!</p>
                        <button class="btn btn-primary race_start-btn">Start Game</button>
                    </div>

                    <div class="race_game-area d-none">
                        <div class="race_timer-bar mb-3" style="height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                            <div class="race_timer-bar-fill" style="height: 100%; width: 100%; background: #007bff; transition: width 0.05s linear;"></div>
                        </div>

                        <div class="race_image-container position-relative mb-3" style="height: 300px; background: #eee; border-radius: 1rem; overflow: hidden;">
                            <img class="race_word-image w-100 h-100 object-fit-cover" style="filter: blur(40px); transition: filter 5s linear;">
                            <button class="race_play-audio-btn position-absolute top-50 start-50 translate-middle btn btn-light rounded-circle shadow" style="width: 60px; height: 60px; font-size: 1.5rem; opacity: 0.8;">🔊</button>
                        </div>

                        <div class="race_input-area">
                            <input type="text" class="form-control race_user-input form-control-lg text-center" placeholder="Type here..." autocomplete="off">
                        </div>

                        <div class="race_feedback-msg text-center mt-3 fs-5 fw-bold" style="min-height: 1.5em;"></div>
                    </div>
                </div>
            </div>
            <style>
                .race_word-image.resolve {
                    filter: blur(0px) !important;
                }
                .race_correct-feedback { color: #28a745; }
                .race_wrong-feedback { color: #dc3545; }
            </style>
        `;
    }

    bindEvents() {
        this.elements.startBtn.onclick = () => this.startGame();
        this.elements.playBtn.onclick = () => this.playAudio();
        this.elements.input.oninput = (e) => this.checkInput(e.target.value);
    }

    init(data) {
        // Filter cards with image and audio
        this.allCards = data ? data.filter(c => c.image && c.audio && !c.hidden) : [];
        if (this.allCards.length === 0) {
             this.elements.feedback.textContent = "No valid cards found for this game.";
        }
    }

    startGame() {
        this.elements.startScreen.classList.add('d-none');
        this.root.querySelector('.race_game-area').classList.remove('d-none');
        this.score = 0;
        this.updateScore();
        this.nextRound();
    }

    nextRound() {
        if (this.allCards.length === 0) return;

        this.isGameOver = false;
        this.currentCard = this.allCards[Math.floor(Math.random() * this.allCards.length)];
        
        // Reset UI
        this.elements.input.value = '';
        this.elements.input.disabled = false;
        this.elements.input.focus();
        this.elements.feedback.textContent = '';
        this.elements.feedback.className = 'race_feedback-msg text-center mt-3 fs-5 fw-bold';
        
        // Reset Image and blur
        this.elements.image.classList.remove('resolve');
        this.elements.image.src = `assets/${this.currentCard.image}`;
        
        // Start Resolve and Audio
        if (this.resolveTimeout) clearTimeout(this.resolveTimeout);
        this.resolveTimeout = setTimeout(() => {
            this.elements.image.classList.add('resolve');
            this.playAudio();
            this.startTimer();
        }, 100);
    }

    startTimer() {
        this.timeLeft = 5000;
        this.startTime = Date.now();
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            this.timeLeft = Math.max(0, 5000 - elapsed);
            
            const percent = (this.timeLeft / 5000) * 100;
            this.elements.timer.style.width = `${percent}%`;
            
            if (this.timeLeft <= 0) {
                this.endRound(false);
            }
        }, 50);
    }

    playAudio() {
        if (this.currentCard && this.currentCard.audio) {
            if (window.playAudio) {
                window.playAudio(`assets/${this.currentCard.audio}`);
            } else {
                const audio = new Audio(`assets/${this.currentCard.audio}`);
                audio.play().catch(e => console.error('Audio play failed', e));
            }
        }
    }

    checkInput(val) {
        if (this.isGameOver) return;

        const guess = val.trim().toLowerCase();
        const reading = this.currentCard.reading.toLowerCase();
        const kanji = this.currentCard.kanji.toLowerCase();
        const meaning = this.cleanMeaning(this.currentCard.meaning).toLowerCase();

        // Exact match for reading, kanji or cleaned meaning
        if (guess === reading || guess === kanji || guess === meaning) {
            this.endRound(true);
        }
    }

    cleanMeaning(meaning) {
        return meaning.replace(/^\(.*?\)\s*/, '').replace(/\d+\.\s*/g, '').trim();
    }

    endRound(success) {
        this.isGameOver = true;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.elements.input.disabled = true;
        this.elements.image.classList.add('resolve'); // Force resolve

        if (success) {
            const points = Math.floor((this.timeLeft / 5000) * 900) + 100;
            this.score += points;
            this.updateScore();
            this.elements.feedback.textContent = `Correct! +${points}`;
            this.elements.feedback.classList.add('race_correct-feedback');
        } else {
            this.elements.feedback.textContent = `Time's up! It was: ${this.currentCard.reading}`;
            this.elements.feedback.classList.add('race_wrong-feedback');
        }

        setTimeout(() => {
            if (!this.isGameOver) return; // Guard against game stop
            this.nextRound();
        }, 2500);
    }

    updateScore() {
        this.elements.score.textContent = `Score: ${this.score}`;
    }

    stopGame() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.resolveTimeout) clearTimeout(this.resolveTimeout);
        this.isGameOver = true;
    }
}

window.ResolutionRace = ResolutionRace;
