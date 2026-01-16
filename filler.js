import { StatsModule } from './stats.js';
import { SRSModule } from './srs.js';

export const FillerModule = {
    data: [],
    container: null,
    isOneByOne: true, // Default true
    currentIndex: 0,
    startTime: null,

    init(drills, container) {
        // Prioritize data
        this.data = SRSModule.prioritize(drills);
        this.container = container;
        this.currentIndex = 0;

        // Listen for view toggle in parent (app.js handles the switch rendering, we just listen)
        const toggle = document.getElementById('view-toggle');
        if (toggle) {
            toggle.checked = this.isOneByOne;
            toggle.addEventListener('change', (e) => {
                this.isOneByOne = e.target.checked;
                this.render();
            });
        }

        this.render();
    },

    render() {
        this.container.innerHTML = '';

        if (this.isOneByOne) {
            this.renderOneByOne();
        } else {
            this.renderAll();
        }

        // Add Enter key listener for inputs
        // Remove old if any? Since we re-render, we just re-attach.
        // Wait, app.js attaches a listener to #check-btn.
        // We need to attach Enter key on inputs to trigger logic.
        this.attachEnterListener();
    },

    attachEnterListener() {
        const inputs = this.container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (this.isOneByOne) {
                        this.checkOneAnswer();
                    } else {
                        // For "All" view, we might not want Enter to submit all. 
                        // Maybe focus next? Or trigger check all.
                        // Let's trigger check all.
                        document.getElementById('check-btn').click();
                    }
                }
            });
        });
    },

    renderOneByOne() {
        if (this.currentIndex >= this.data.length) {
            this.showVictory();
            return;
        }

        const drill = this.data[this.currentIndex];

        // Hide main check/reset buttons in One-By-One mode as we handle it per card
        const mainBtns = document.querySelector('#check-btn')?.parentElement;
        if (mainBtns) mainBtns.classList.add('d-none');

        this.container.innerHTML = `
            <div class="card shadow-sm border-0 mt-4 mx-auto" style="max-width: 600px;">
                <div class="card-body p-4 text-center">
                    <span class="badge bg-light text-muted border mb-3">
                        Question ${this.currentIndex + 1} / ${this.data.length}
                    </span>
                     
                    <h2 class="mb-4 japanese-text">${drill.sentence.replace('__________', '<span class="text-primary">__________</span>')}</h2>
                    <p class="text-muted mb-4">${drill.translation}</p>
                    
                    <div class="hint-box p-3 mb-4 text-start bg-light small">
                        <i class="bi bi-lightbulb-fill text-warning me-2"></i> ${drill.hint}
                    </div>

                    <input type="text" id="input-${drill.id}" class="form-control form-control-lg text-center mb-3" 
                        placeholder="Type answer (Romaji ok)" autocomplete="off">
                    
                    <div id="feedback-${drill.id}" class="mb-3" style="min-height: 24px;"></div>

                    <button class="btn btn-gradient-blue btn-lg w-100" id="obo-check-btn">Check</button>
                    <button class="btn btn-secondary w-100 mt-2 d-none" id="obo-next-btn">Next</button>
                </div>
            </div>
            
            <div class="text-center mt-3">
                 <small class="text-muted">Press <strong>Enter</strong> to submit</small>
            </div>
        `;

        // Focus input
        setTimeout(() => document.getElementById(`input-${drill.id}`).focus(), 100);

        document.getElementById('obo-check-btn').addEventListener('click', () => this.checkOneAnswer());
        document.getElementById('obo-next-btn').addEventListener('click', () => {
            this.currentIndex++;
            this.render();
        });
    },

    checkOneAnswer() {
        if (this.currentIndex >= this.data.length) return;

        const drill = this.data[this.currentIndex];
        const input = document.getElementById(`input-${drill.id}`);
        const feedback = document.getElementById(`feedback-${drill.id}`);
        const checkBtn = document.getElementById('obo-check-btn');
        const nextBtn = document.getElementById('obo-next-btn');

        if (!input || !feedback) return;

        const val = input.value.trim().toLowerCase();
        // Allow Exact Match OR Romaji
        const isCorrect = (val === drill.answer) || (drill.romaji_answer && val === drill.romaji_answer.toLowerCase());

        input.disabled = true;
        checkBtn.classList.add('d-none');
        nextBtn.classList.remove('d-none');
        nextBtn.focus();

        if (isCorrect) {
            input.classList.add('is-valid');
            feedback.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle"></i> Correct! ${drill.answer}</span>`;
            StatsModule.addXP(10);
            SRSModule.processResult(drill.id, 5);
        } else {
            input.classList.add('is-invalid');
            feedback.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-x-circle"></i> Wrong. Answer: ${drill.answer} (${drill.romaji_answer})</span>`;
            // XP penalty? No, just no gain.
            SRSModule.processResult(drill.id, 0);
        }
    },

    renderAll() {
        // Show main buttons
        const mainBtns = document.querySelector('#check-btn')?.parentElement;
        if (mainBtns) mainBtns.classList.remove('d-none');

        this.container.innerHTML = `
            <div class="row g-4">
                ${this.data.map(drill => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 shadow-sm border-0 exercise-card">
                            <div class="card-body">
                                <h5 class="card-title japanese-text mb-3">${drill.sentence}</h5>
                                <p class="card-text text-muted small mb-3">${drill.translation}</p>
                                <div class="mb-3">
                                    <input type="text" class="form-control" id="input-${drill.id}" data-id="${drill.id}" placeholder="Masu-form">
                                    <div class="invalid-feedback" id="feedback-${drill.id}"></div>
                                </div>
                            </div>
                            <div class="card-footer bg-transparent border-0">
                                <small class="text-muted"><i class="bi bi-info-circle me-1"></i> ${drill.hint}</small>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    validate() {
        if (this.isOneByOne) return false; // Handled internally

        let correctCount = 0;
        let total = this.data.length;

        this.data.forEach(drill => {
            const input = document.getElementById(`input-${drill.id}`);
            const feedback = document.getElementById(`feedback-${drill.id}`);
            if (!input) return;

            const val = input.value.trim().toLowerCase();
            const isCorrect = (val === drill.answer) || (drill.romaji_answer && val === drill.romaji_answer.toLowerCase());

            if (isCorrect) {
                input.classList.remove('is-invalid');
                input.classList.add('is-valid');
                feedback.innerText = '';
                correctCount++;
                SRSModule.processResult(drill.id, 5);
            } else {
                input.classList.add('is-invalid');
                feedback.innerText = `Correct: ${drill.answer}`;
                SRSModule.processResult(drill.id, 0);
            }
        });

        return correctCount === total; // Returns true if perfect? logic in app.js just awards XP 
        // We should move XP logic here mostly? 
        // App.js: if (FillerModule.validate()) StatsModule.addXP(10);
        // This awards 10XP for pressing check? That's weird.
        // Let's rely on SRS/Stats internally in this module for granular updates? 
        // No, let's keep it simple.
    },

    showVictory() {
        this.container.innerHTML = `
            <div class="text-center p-5 fade-in">
                <i class="bi bi-check-circle-fill text-success display-1 mb-4"></i>
                <h2 class="mb-3">Set Complete!</h2>
                <div class="mt-4">
                     <button class="btn btn-outline-secondary me-2" onclick="window.navigateApp('home')">Menu</button>
                    <button class="btn btn-gradient-blue px-4" onclick="window.navigateApp('filler')">Review Again</button>
                </div>
            </div>
        `;
    }
};