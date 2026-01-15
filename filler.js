import { StatsModule } from './stats.js';

export const FillerModule = {
    data: [],
    currentIndex: 0,
    isSingleMode: false,
    container: null,

    init(exercises, container) {
        this.data = exercises;
        this.container = container;
        this.currentIndex = 0;
        this.render();
        this.setupControls();
    },

    setupControls() {
        const toggler = document.getElementById('view-toggle');
        if (toggler) {
            // Unbind old listeners to prevent duplicates if any
            const newToggler = toggler.cloneNode(true);
            toggler.parentNode.replaceChild(newToggler, toggler);

            newToggler.addEventListener('change', (e) => {
                this.isSingleMode = e.target.checked;
                this.render();
            });
            // Restore state
            newToggler.checked = this.isSingleMode;
        }
    },

    render() {
        if (this.isSingleMode) {
            this.renderSingle();
        } else {
            this.renderList();
        }
        this.attachInputListeners();
    },

    renderList() {
        this.container.innerHTML = this.data.map(ex => this.createCard(ex)).join('');
        this.updateNavButtons(false);
    },

    renderSingle() {
        const ex = this.data[this.currentIndex];
        this.container.innerHTML = `
            <div class="single-mode-container fade-in">
                ${this.createCard(ex)}
                <div class="d-flex justify-content-between mt-3">
                    <button class="btn btn-outline-secondary" id="prev-btn" ${this.currentIndex === 0 ? 'disabled' : ''}>Previous</button>
                    <span class="align-self-center text-muted">${this.currentIndex + 1} / ${this.data.length}</span>
                    <button class="btn btn-outline-primary" id="next-btn" ${this.currentIndex === this.data.length - 1 ? 'disabled' : ''}>Next</button>
                </div>
            </div>
        `;
        this.updateNavButtons(true);
    },

    createCard(ex) {
        return `
            <div class="card exercise-card mb-3 shadow-sm" data-id="${ex.id}">
                <div class="card-body">
                    <h5 class="mb-1 japanese-text">${ex.sentence}</h5>
                    <p class="text-muted small">(${ex.translation})</p>
                    <div class="hint-box p-2 mb-3 small text-info"><code>${ex.hint}</code></div>
                    <div class="has-validation position-relative">
                        <input type="text" class="form-control form-control-lg verb-input" 
                               data-id="${ex.id}" placeholder="Type in Japanese or Romaji" autocomplete="off">
                        <div class="invalid-feedback">Correct: ${ex.answer} or ${ex.romaji_answer}</div>
                        <div class="valid-feedback fw-bold">Excellent! <i class="bi bi-stars text-warning"></i></div>
                    </div>
                </div>
            </div>
        `;
    },

    updateNavButtons(isSingle) {
        if (!isSingle) return;

        document.getElementById('prev-btn')?.addEventListener('click', () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.render();
            }
        });

        document.getElementById('next-btn')?.addEventListener('click', () => {
            if (this.currentIndex < this.data.length - 1) {
                this.currentIndex++;
                this.render();
            }
        });
    },

    attachInputListeners() {
        const inputs = this.container.querySelectorAll('.verb-input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.classList.remove('is-invalid', 'is-valid');

                // If TimerModule exists and is active
                if (window.TimerModule && window.TimerModule.isActive && !window.TimerModule.interval) {
                    window.TimerModule.start();
                }
            });
        });
    },

    validate() {
        const inputs = document.querySelectorAll('.verb-input');
        let allCorrect = true;
        let correctCount = 0;

        inputs.forEach(input => {
            const ex = this.data.find(e => e.id == input.dataset.id);
            const val = input.value.trim().toLowerCase();
            const isCorrect = (val === ex.answer) || (val === ex.romaji_answer.toLowerCase());

            input.classList.remove('is-valid', 'is-invalid');

            if (isCorrect) {
                input.classList.add('is-valid');
                input.closest('.card').classList.add('correct-animation');
                correctCount++;
            } else {
                input.classList.add('is-invalid');
                allCorrect = false;
            }
        });

        // XP Reward logic could go here if managed internally,
        // but currently handled by wrapper in app.js for now.
        // Returning boolean for wrapper to decide.
        return allCorrect;
    }
};

export const VocabModule = {
    data: [],
    init(vocabulary, container) {
        this.data = vocabulary;
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        this.data.sort((a, b) => {
            const pa = priorityOrder[a.priority] || 4;
            const pb = priorityOrder[b.priority] || 4;
            return pa - pb;
        });

        container.innerHTML = `
            <div class="table-responsive fade-in">
                <table class="table table-hover align-middle bg-white shadow-sm rounded">
                    <thead class="table-light">
                        <tr>
                            <th>Kanji</th>
                            <th>Kana (Reading)</th>
                            <th>Polite Form</th>
                            <th>Group</th>
                            <th>Meaning</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.map(word => `
                            <tr>
                                <td class="fw-bold text-primary fs-5">${word.kanji}</td>
                                <td>${word.romaji || word.kana}</td>
                                <td>${word.polite}</td>
                                <td><span class="badge bg-secondary">G${word.group}</span></td>
                                <td>${word.meaning}</td>
                                <td>${this.getPriorityBadge(word.priority)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getPriorityBadge(priority) {
        switch (priority) {
            case 'High': return '<span class="badge bg-danger">High</span>';
            case 'Medium': return '<span class="badge bg-warning text-dark">Medium</span>';
            case 'Low': return '<span class="badge bg-info">Low</span>';
            default: return '<span class="badge bg-light text-muted">-</span>';
        }
    }
};

// Timer module is kept for compatibility if needed, though mostly unused in new flow
export const TimerModule = {
    seconds: 0,
    interval: null,
    isActive: false,
    init() { }, // No-op
    start() { },
    stop() { },
    reset() { }
};