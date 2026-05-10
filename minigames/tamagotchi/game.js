/**
 * Tamagotchi Game Logic
 * Modular pattern using a class to manage state, persistence, and UI.
 */

class Tamagotchi {
    constructor() {
        // Initial state or load from localStorage
        const savedState = JSON.parse(localStorage.getItem('tamagotchiState')) || {};
        
        this.stats = {
            hunger: savedState.hunger ?? 100,      // 空腹 (100 = full)
            mood: savedState.mood ?? 100,          // 機嫌
            energy: savedState.energy ?? 100,      // 体力
            cleanliness: savedState.cleanliness ?? 100 // 清潔
        };
        
        this.age = savedState.age ?? 0;
        this.lastTick = savedState.lastTick ?? Date.now();
        this.difficulty = savedState.difficulty ?? 'normal';
        this.isSleeping = savedState.isSleeping ?? false;
        
        this.difficultySettings = {
            casual: 0.5,
            normal: 1.0,
            hard: 2.0
        };

        this.init();
    }

    init() {
        // Calculate offline progress
        this.calculateOfflineProgress();
        
        // Start game loop
        this.gameLoop = setInterval(() => this.tick(), 3000); // Tick every 3 seconds
        
        // Bind UI elements
        this.bindEvents();
        this.render();
    }

    calculateOfflineProgress() {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.lastTick) / 1000);
        
        if (elapsedSeconds > 0) {
            // Deplete stats based on time away
            const factor = this.difficultySettings[this.difficulty];
            const depletionRate = 0.1 * factor; // 0.1% per second away
            
            const totalDepletion = elapsedSeconds * depletionRate;
            
            this.stats.hunger = Math.max(0, this.stats.hunger - totalDepletion);
            this.stats.mood = Math.max(0, this.stats.mood - totalDepletion);
            this.stats.energy = Math.max(0, this.stats.energy - (this.isSleeping ? -totalDepletion * 2 : totalDepletion));
            this.stats.cleanliness = Math.max(0, this.stats.cleanliness - totalDepletion);
            
            // Age increases (e.g., 1 day per 24 hours real time)
            this.age += elapsedSeconds / (24 * 3600);
            
            this.lastTick = now;
            this.save();
        }
    }

    tick() {
        if (this.isDead()) return;

        const factor = this.difficultySettings[this.difficulty];
        
        // Natural depletion
        if (this.isSleeping) {
            this.updateStat('energy', 5);
            this.updateStat('hunger', -0.5 * factor);
            this.updateStat('cleanliness', -0.2 * factor);
            
            if (this.stats.energy >= 100) {
                this.isSleeping = false;
                this.showMessage('おはよう！');
            }
        } else {
            this.updateStat('hunger', -1 * factor);
            this.updateStat('mood', -0.8 * factor);
            this.updateStat('energy', -0.5 * factor);
            this.updateStat('cleanliness', -0.3 * factor);
        }

        // Increase age slightly
        this.age += 0.001;
        
        this.lastTick = Date.now();
        this.save();
        this.render();
    }

    updateStat(key, amount) {
        this.stats[key] = Math.min(100, Math.max(0, this.stats[key] + amount));
    }

    isDead() {
        return this.stats.hunger <= 0 && this.stats.energy <= 0;
    }

    save() {
        const state = {
            ...this.stats,
            age: this.age,
            lastTick: this.lastTick,
            difficulty: this.difficulty,
            isSleeping: this.isSleeping
        };
        localStorage.setItem('tamagotchiState', JSON.stringify(state));
    }

    // Actions
    feed() {
        if (this.isSleeping) return;
        this.updateStat('hunger', 20);
        this.updateStat('cleanliness', -5);
        this.showMessage('おいしい！');
        this.render();
    }

    play() {
        if (this.isSleeping) return;
        if (this.stats.energy < 10) {
            this.showMessage('疲れている...');
            return;
        }
        this.updateStat('mood', 30);
        this.updateStat('energy', -15);
        this.updateStat('hunger', -10);
        this.showMessage('たのしい！');
        this.render();
    }

    sleep() {
        if (this.isSleeping) {
            this.isSleeping = false;
            this.showMessage('起きた！');
        } else {
            this.isSleeping = true;
            this.showMessage('おやすみ...');
        }
        this.render();
    }

    clean() {
        if (this.isSleeping) return;
        this.updateStat('cleanliness', 40);
        this.updateStat('mood', 10);
        this.showMessage('ピカピカ！');
        this.render();
    }

    showMessage(text) {
        const area = document.getElementById('message-area');
        area.textContent = text;
        setTimeout(() => {
            if (area.textContent === text) area.textContent = '';
        }, 2000);
    }

    // UI Rendering
    render() {
        // Update Bars
        this.renderBar('hunger-bar', this.stats.hunger);
        this.renderBar('mood-bar', this.stats.mood);
        this.renderBar('energy-bar', this.stats.energy);
        this.renderBar('clean-bar', this.stats.cleanliness);

        // Update Age
        document.getElementById('pet-age').textContent = Math.floor(this.age);

        // Update SVG
        this.renderPet();

        // Handle Death
        if (this.isDead()) {
            clearInterval(this.gameLoop);
            this.showMessage('お亡くなりになりました...');
            document.getElementById('action-bar').style.pointerEvents = 'none';
            document.getElementById('action-bar').style.opacity = '0.5';
        }
    }

    renderBar(id, value) {
        const bar = document.getElementById(id);
        bar.style.width = `${value}%`;
        
        bar.className = 'progress-bar';
        if (value > 60) bar.classList.add('status-good');
        else if (value > 20) bar.classList.add('status-warn');
        else bar.classList.add('status-danger');
    }

    renderPet() {
        const container = document.getElementById('pet-svg-container');
        let state = 'happy';

        if (this.isSleeping) state = 'sleeping';
        else if (this.stats.hunger < 30 || this.stats.mood < 30 || this.isDead()) state = 'sad';

        container.innerHTML = this.getPetSVG(state);
        container.className = this.isSleeping ? 'pet-sleeping' : 'pet-happy';
    }

    getPetSVG(state) {
        const color = this.isDead() ? '#ccc' : '#ffd1dc';
        let face = '';

        if (state === 'happy') {
            face = `
                <circle cx="35" cy="45" r="3" fill="#333" />
                <circle cx="65" cy="45" r="3" fill="#333" />
                <path d="M40 65 Q50 75 60 65" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round" />
            `;
        } else if (state === 'sad') {
            face = `
                <path d="M30 50 L40 45" stroke="#333" stroke-width="2" />
                <path d="M70 50 L60 45" stroke="#333" stroke-width="2" />
                <path d="M40 70 Q50 60 60 70" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round" />
            `;
        } else if (state === 'sleeping') {
            face = `
                <path d="M30 45 Q35 40 40 45" stroke="#333" stroke-width="2" fill="none" />
                <path d="M60 45 Q65 40 70 45" stroke="#333" stroke-width="2" fill="none" />
                <path d="M45 65 H55" stroke="#333" stroke-width="2" />
                <text x="75" y="30" font-family="Arial" font-size="12" fill="#aaa">zZz</text>
            `;
        }

        return `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="55" r="40" fill="${color}" />
                <path d="M20 25 Q15 5 35 15" fill="${color}" />
                <path d="M80 25 Q85 5 65 15" fill="${color}" />
                ${face}
            </svg>
        `;
    }

    bindEvents() {
        document.getElementById('feed-btn').onclick = () => this.feed();
        document.getElementById('play-btn').onclick = () => this.play();
        document.getElementById('sleep-btn').onclick = () => this.sleep();
        document.getElementById('clean-btn').onclick = () => this.clean();
        
        document.getElementById('difficulty-select').onchange = (e) => {
            this.difficulty = e.target.value;
            this.save();
        };
    }
}

// Start the game
window.onload = () => {
    new Tamagotchi();

    // Listen for theme sync messages
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'set-theme') {
            document.documentElement.setAttribute('data-bs-theme', event.data.theme);
        }
    });
};
