/**
 * Resolution Race Minigame Logic
 */

class ResolutionRace {
    constructor() {
        this.allCards = [];
        this.currentCard = null;
        this.score = 0;
        this.timeLeft = 5000; // 5 seconds in ms
        this.timerInterval = null;
        this.startTime = null;
        this.isGameOver = false;

        this.elements = {
            image: document.getElementById('word-image'),
            input: document.getElementById('user-input'),
            score: document.getElementById('score-display'),
            timer: document.getElementById('timer-bar'),
            feedback: document.getElementById('feedback-msg'),
            playBtn: document.getElementById('play-audio-btn'),
            startScreen: document.getElementById('start-screen'),
            startBtn: document.getElementById('start-btn')
        };

        this.init();
    }

    async init() {
        try {
            const response = await fetch('../../data.json');
            const data = await response.json();
            // Filter cards with image and audio
            this.allCards = data.filter(c => c.image && c.audio && !c.hidden);
            
            this.elements.startBtn.onclick = () => this.startGame();
            this.elements.playBtn.onclick = () => this.playAudio();
            
            this.elements.input.oninput = (e) => this.checkInput(e.target.value);

            // Theme sync listener
            window.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'set-theme') {
                    document.documentElement.setAttribute('data-bs-theme', event.data.theme);
                }
            });
        } catch (err) {
            console.error('Failed to load game data:', err);
        }
    }

    startGame() {
        this.elements.startScreen.style.display = 'none';
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
        this.elements.feedback.className = '';
        
        // Reset Image
        this.elements.image.classList.remove('resolve');
        this.elements.image.src = `../../assets/${this.currentCard.image}`;
        
        // Start Resolve and Audio
        setTimeout(() => {
            this.elements.image.classList.add('resolve');
            this.playAudio();
            this.startTimer();
        }, 100);
    }

    startTimer() {
        this.timeLeft = 5000;
        this.startTime = Date.now();
        clearInterval(this.timerInterval);
        
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
            const audio = new Audio(`../../assets/${this.currentCard.audio}`);
            audio.play().catch(e => console.error('Audio play failed', e));
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
        clearInterval(this.timerInterval);
        this.elements.input.disabled = true;
        this.elements.image.classList.add('resolve'); // Force resolve

        if (success) {
            // Points based on time left (max 1000, min 100)
            const points = Math.floor((this.timeLeft / 5000) * 900) + 100;
            this.score += points;
            this.updateScore();
            this.elements.feedback.textContent = `Correct! +${points}`;
            this.elements.feedback.className = 'correct-feedback';
        } else {
            this.elements.feedback.textContent = `Time's up! It was: ${this.currentCard.reading}`;
            this.elements.feedback.className = 'wrong-feedback';
        }

        setTimeout(() => this.nextRound(), 2500);
    }

    updateScore() {
        this.elements.score.textContent = `Score: ${this.score}`;
    }
}

window.onload = () => {
    new ResolutionRace();
};
