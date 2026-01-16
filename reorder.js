import { StatsModule } from './stats.js';
import { SRSModule } from './srs.js';

export const ReorderModule = {
    data: [],
    currentIndex: 0,
    container: null,
    currentOrder: [],

    init(exercises, container) {
        this.data = SRSModule.prioritize(exercises);
        this.container = container;
        this.currentIndex = 0;
        this.render();
    },

    render() {
        if (this.currentIndex >= this.data.length) {
            this.renderComplete();
            return;
        }

        const drill = this.data[this.currentIndex];
        this.currentOrder = []; // Reset current user order

        this.container.innerHTML = `
            <div class="container fade-in" style="max-width: 700px;">
                <div class="card shadow-sm border-0 mt-4">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <span class="badge bg-light text-muted border">Sentence ${this.currentIndex + 1} / ${this.data.length}</span>
                        </div>

                        <h4 class="text-center mb-4 text-muted">"${drill.meaning}"</h4>

                        <div class="bg-light p-3 rounded mb-4 text-center d-flex flex-wrap gap-2 justify-content-center min-dh-60" style="min-height: 80px;" id="answer-zone">
                            <span class="text-muted small align-self-center fst-italic placeholder-text">Tap words to build sentence</span>
                        </div>

                        <div class="d-flex flex-wrap gap-2 justify-content-center" id="word-bank">
                             ${drill.parts.map((word, idx) => `
                                <button class="btn btn-outline-dark word-btn" data-word="${word}" data-idx="${idx}">${word}</button>
                             `).join('')}
                        </div>

                        <div id="feedback-area" class="mt-4 text-center" style="height: 40px;"></div>
                        
                        <div class="text-center mt-3">
                            <button class="btn btn-secondary me-2" id="reset-btn"><i class="bi bi-arrow-counterclockwise"></i> Reset</button>
                            <button class="btn btn-gradient-blue px-4" id="check-btn">Check Answer</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners(drill);
    },

    attachListeners(drill) {
        const bank = this.container.querySelector('#word-bank');
        const zone = this.container.querySelector('#answer-zone');
        const btns = bank.querySelectorAll('.word-btn');
        const placeholder = zone.querySelector('.placeholder-text');

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.disabled) return;

                // visual move
                btn.classList.add('d-none'); // Hide in bank
                // Create chip in zone
                const chip = document.createElement('button');
                chip.className = 'btn btn-primary word-chip shadow-sm';
                chip.innerText = btn.innerText;
                chip.dataset.originIdx = btn.dataset.idx;

                chip.addEventListener('click', () => {
                    // Return to bank
                    chip.remove();
                    btn.classList.remove('d-none');
                    this.currentOrder = this.currentOrder.filter(w => w !== btn.dataset.word);
                    if (zone.children.length === 0 && placeholder) zone.appendChild(placeholder);
                });

                if (placeholder && zone.contains(placeholder)) placeholder.remove();
                zone.appendChild(chip);
                this.currentOrder.push(btn.dataset.word);
            });
        });

        this.container.querySelector('#reset-btn').addEventListener('click', () => {
            this.currentOrder = [];
            this.render(); // Re-render is easiest reset
        });

        this.container.querySelector('#check-btn').addEventListener('click', () => {
            this.checkAnswer(drill);
        });
    },

    checkAnswer(drill) {
        const feedback = document.getElementById('feedback-area');
        const isCorrect = JSON.stringify(this.currentOrder) === JSON.stringify(drill.correct_order);

        if (isCorrect) {
            feedback.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle"></i> Correct!</span>`;
            StatsModule.addXP(10);
            SRSModule.processResult(drill.id, 5);
            setTimeout(() => {
                this.currentIndex++;
                this.render();
            }, 1500);
        } else {
            feedback.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-x-circle"></i> Incorrect order. Try again.</span>`;
            SRSModule.processResult(drill.id, 1); // Penalize but don't fail hard if they fix it? 
            // Actually SM-2 handles it. 
        }
    },

    renderComplete() {
        this.container.innerHTML = `
            <div class="text-center p-5 fade-in">
                <i class="bi bi-check-all text-primary display-1 mb-4"></i>
                <h2 class="mb-3">Excellent Work!</h2>
                <p class="lead text-muted">You have rebuilt all the sentences.</p>
                <div class="mt-4">
                     <button class="btn btn-outline-secondary me-2" onclick="window.navigateApp('home')">Menu</button>
                    <button class="btn btn-gradient-blue px-4" onclick="window.navigateApp('reorder')">Play Again</button>
                </div>
            </div>
        `;
    }
};
