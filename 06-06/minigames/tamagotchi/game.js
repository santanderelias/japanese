/**
 * Tamagotchi Game Logic
 * Modular pattern using a class to manage state, persistence, and UI.
 */

class Tamagotchi {
    constructor(rootId) {
        this.root = document.getElementById(rootId);
        
        // Load state or defaults
        const savedState = JSON.parse(localStorage.getItem('tamagotchiState')) || {};
        this.stats = {
            hunger: savedState.hunger ?? 80,
            mood: savedState.mood ?? 80,
            energy: savedState.energy ?? 80,
            cleanliness: savedState.cleanliness ?? 80
        };
        this.age = savedState.age ?? 0;
        this.lastTick = savedState.lastTick ?? Date.now();
        this.difficulty = savedState.difficulty ?? 'normal';
        this.isSleeping = savedState.isSleeping ?? false;

        this.difficultySettings = {
            easy: 0.5,
            normal: 1,
            hard: 1.5
        };

        this.gameLoop = null;

        this.injectHTML();
        this.bindEvents();
    }

    injectHTML() {
        this.root.innerHTML = `
            <div class="tamagotchi_game">
                <header class="tamagotchi_header mb-4">
                    <h1 class="display-6 fw-bold text-primary"><ruby>電子<rt>でんし</rt></ruby>ペット</h1>
                </header>
                
                <section class="tamagotchi_status_board px-3 mb-4">
                    <div class="tamagotchi_status_item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><ruby>空腹<rt>くうふく</rt></ruby> (Hunger)</span>
                            <span id="hunger-val">80%</span>
                        </div>
                        <div class="tamagotchi_progress_bar">
                            <div id="hunger-bar" class="tamagotchi_bar_fill"></div>
                        </div>
                    </div>
                    <div class="tamagotchi_status_item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><ruby>機嫌<rt>きげん</rt></ruby> (Mood)</span>
                            <span id="mood-val">80%</span>
                        </div>
                        <div class="tamagotchi_progress_bar">
                            <div id="mood-bar" class="tamagotchi_bar_fill"></div>
                        </div>
                    </div>
                    <div class="tamagotchi_status_item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><ruby>元気<rt>げんき</rt></ruby> (Energy)</span>
                            <span id="energy-val">80%</span>
                        </div>
                        <div class="tamagotchi_progress_bar">
                            <div id="energy-bar" class="tamagotchi_bar_fill"></div>
                        </div>
                    </div>
                    <div class="tamagotchi_status_item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><ruby>清潔<rt>せいけつ</rt></ruby> (Clean)</span>
                            <span id="clean-val">80%</span>
                        </div>
                        <div class="tamagotchi_progress_bar">
                            <div id="clean-bar" class="tamagotchi_bar_fill"></div>
                        </div>
                    </div>
                </section>

                <div class="text-center mb-4">
                    <div id="pet-svg-container" style="height: 180px;"></div>
                    <div id="message-area" class="mt-2 fw-bold text-primary" style="height: 1.5em;"></div>
                    <div class="mt-2 text-muted small">Age: <span id="pet-age">0</span> days</div>
                </div>

                <div id="action-bar" class="d-grid gap-2" style="grid-template-columns: 1fr 1fr;">
                    <button id="feed-btn" class="btn btn-outline-success py-3">🍙 Feed</button>
                    <button id="play-btn" class="btn btn-outline-info py-3">🎾 Play</button>
                    <button id="sleep-btn" class="btn btn-outline-primary py-3">💤 Sleep</button>
                    <button id="clean-btn" class="btn btn-outline-warning py-3">✨ Clean</button>
                </div>

                <div class="mt-4 px-3">
                    <label class="form-label small text-muted">Difficulty</label>
                    <select id="difficulty-select" class="form-select form-select-sm bg-body-tertiary">
                        <option value="easy">Easy (Study Mode)</option>
                        <option value="normal">Normal</option>
                        <option value="hard">Hard (Survivor)</option>
                    </select>
                </div>
            </div>
            <style>
                .pet-happy { animation: float 3s ease-in-out infinite; }
                .pet-sleeping { animation: breathe 4s ease-in-out infinite; opacity: 0.8; }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
            </style>
        `;
    }

    init(data) {
        // Tamagotchi doesn't strictly need the cards data but we follow the signature
        this.calculateOfflineProgress();
        this.gameLoop = setInterval(() => this.tick(), 3000);
        this.render();
        
        const diffSelect = this.root.querySelector('#difficulty-select');
        if (diffSelect) diffSelect.value = this.difficulty;
    }

    calculateOfflineProgress() {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - this.lastTick) / 1000);
        
        if (elapsedSeconds > 0) {
            const factor = this.difficultySettings[this.difficulty];
            const depletionRate = 0.05 * factor; // Decreased slightly for better balance
            
            const totalDepletion = elapsedSeconds * depletionRate;
            
            this.stats.hunger = Math.max(0, this.stats.hunger - totalDepletion);
            this.stats.mood = Math.max(0, this.stats.mood - totalDepletion);
            this.stats.energy = Math.max(0, this.stats.energy - (this.isSleeping ? -totalDepletion * 2 : totalDepletion));
            this.stats.cleanliness = Math.max(0, this.stats.cleanliness - totalDepletion);
            
            this.age += elapsedSeconds / (24 * 3600);
            this.lastTick = now;
            this.save();
        }
    }

    tick() {
        if (this.isDead()) return;

        const factor = this.difficultySettings[this.difficulty];
        
        if (this.isSleeping) {
            this.updateStat('energy', 5);
            this.updateStat('hunger', -0.2 * factor);
            this.updateStat('cleanliness', -0.1 * factor);
            
            if (this.stats.energy >= 100) {
                this.isSleeping = false;
                this.showMessage('おはよう！ (Good morning!)');
            }
        } else {
            this.updateStat('hunger', -0.5 * factor);
            this.updateStat('mood', -0.4 * factor);
            this.updateStat('energy', -0.2 * factor);
            this.updateStat('cleanliness', -0.1 * factor);
        }

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

    feed() {
        if (this.isSleeping || this.isDead()) return;
        this.updateStat('hunger', 20);
        this.updateStat('cleanliness', -5);
        this.showMessage('おいしい！ (Delicious!)');
        this.render();
    }

    play() {
        if (this.isSleeping || this.isDead()) return;
        if (this.stats.energy < 10) {
            this.showMessage('疲れている... (Tired...)');
            return;
        }
        this.updateStat('mood', 30);
        this.updateStat('energy', -15);
        this.updateStat('hunger', -10);
        this.showMessage('たのしい！ (Fun!)');
        this.render();
    }

    sleep() {
        if (this.isDead()) return;
        this.isSleeping = !this.isSleeping;
        this.showMessage(this.isSleeping ? 'おやすみ... (Goodnight...)' : '起きた！ (Woke up!)');
        this.render();
    }

    clean() {
        if (this.isSleeping || this.isDead()) return;
        this.updateStat('cleanliness', 40);
        this.updateStat('mood', 10);
        this.showMessage('ピカピカ！ (Sparkling!)');
        this.render();
    }

    showMessage(text) {
        const area = this.root.querySelector('#message-area');
        if (!area) return;
        area.textContent = text;
        setTimeout(() => {
            if (area.textContent === text) area.textContent = '';
        }, 3000);
    }

    render() {
        this.renderBar('hunger-bar', this.stats.hunger, 'hunger-val');
        this.renderBar('mood-bar', this.stats.mood, 'mood-val');
        this.renderBar('energy-bar', this.stats.energy, 'energy-val');
        this.renderBar('clean-bar', this.stats.cleanliness, 'clean-val');

        this.root.querySelector('#pet-age').textContent = this.age.toFixed(2);
        this.renderPet();

        if (this.isDead()) {
            clearInterval(this.gameLoop);
            this.showMessage('お亡くなりになりました... (Died...)');
            this.root.querySelector('#action-bar').style.pointerEvents = 'none';
            this.root.querySelector('#action-bar').style.opacity = '0.5';
        }
    }

    renderBar(id, value, valId) {
        const bar = this.root.querySelector(`#${id}`);
        const valSpan = this.root.querySelector(`#${valId}`);
        if (!bar || !valSpan) return;

        bar.style.width = `${value}%`;
        valSpan.textContent = `${Math.floor(value)}%`;
        
        bar.className = 'tamagotchi_bar_fill';
        if (value > 60) bar.classList.add('tamagotchi_status_good');
        else if (value > 20) bar.classList.add('tamagotchi_status_warn');
        else bar.classList.add('tamagotchi_status_danger');
    }

    renderPet() {
        const container = this.root.querySelector('#pet-svg-container');
        let state = 'happy';

        if (this.isDead()) state = 'sad';
        else if (this.isSleeping) state = 'sleeping';
        else if (this.stats.hunger < 30 || this.stats.mood < 30) state = 'sad';

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
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="height: 100%;">
                <circle cx="50" cy="55" r="40" fill="${color}" />
                <path d="M20 25 Q15 5 35 15" fill="${color}" />
                <path d="M80 25 Q85 5 65 15" fill="${color}" />
                ${face}
            </svg>
        `;
    }

    bindEvents() {
        this.root.querySelector('#feed-btn').onclick = () => this.feed();
        this.root.querySelector('#play-btn').onclick = () => this.play();
        this.root.querySelector('#sleep-btn').onclick = () => this.sleep();
        this.root.querySelector('#clean-btn').onclick = () => this.clean();
        
        const diffSelect = this.root.querySelector('#difficulty-select');
        if (diffSelect) {
            diffSelect.onchange = (e) => {
                this.difficulty = e.target.value;
                this.save();
            };
        }
    }

    stopGame() {
        if (this.gameLoop) clearInterval(this.gameLoop);
    }
}

window.Tamagotchi = Tamagotchi;
