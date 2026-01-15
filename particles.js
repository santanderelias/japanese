import { StatsModule } from './stats.js';

export const ParticlesModule = {
    data: [],
    currentIndex: 0,
    container: null,

    init(drills, container) {
        this.data = drills;
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

        // Construct Sentence with Ruby support
        // drill.sentence_parts is expected to be an array of {text, furigana} objects
        // If data is older format (string), fallback gracefully
        let sentenceHtml = '';
        if (drill.sentence_parts) {
            sentenceHtml = drill.sentence_parts.map(part => {
                if (part.text === '___') return '<span class="text-primary border-bottom border-primary px-3 mx-1">?</span>';
                if (part.furigana) {
                    return `<ruby class="mx-1">${part.text}<rt>${part.furigana}</rt></ruby>`;
                }
                return `<span class="mx-1">${part.text}</span>`;
            }).join('');
        } else {
            // Legacy string support
            sentenceHtml = drill.question.replace('___', '<span class="text-primary border-bottom border-primary px-3">?</span>');
        }

        this.container.innerHTML = `
            <div class="container fade-in" style="max-width: 600px;">
                <div class="card shadow-sm border-0 mt-4">
                    <div class="card-body p-4 text-center">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="badge bg-light text-muted border">Question ${this.currentIndex + 1} / ${this.data.length}</span>
                        </div>
                        
                        <div class="mb-4 d-flex justify-content-center align-items-end flex-wrap japanese-text lh-lg" style="font-size: 2rem;">
                            ${sentenceHtml}
                        </div>
                        
                        ${drill.romaji ? `<p class="text-muted fst-italic mb-5">${drill.romaji}</p>` : ''}

                        <div class="d-grid gap-3" id="options-grid">
                            ${drill.options.map(opt => `
                                <button class="btn btn-outline-dark btn-lg option-btn" data-val="${opt}">${opt}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div id="feedback-area" class="mt-3 text-center" style="height: 50px;"></div>
            </div>
        `;

        this.attachListeners(drill);
    },

    attachListeners(drill) {
        const buttons = this.container.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAnswer(e.target, drill));
        });
    },

    handleAnswer(btn, drill) {
        const val = btn.dataset.val;
        const isCorrect = val === drill.answer;
        const feedback = document.getElementById('feedback-area');

        this.container.querySelectorAll('.option-btn').forEach(b => {
            b.disabled = true;
            if (b.dataset.val === drill.answer) b.classList.add('btn-success', 'text-white');
            else if (b === btn && !isCorrect) b.classList.add('btn-danger', 'text-white');
        });

        if (isCorrect) {
            StatsModule.addXP(5);
            feedback.innerHTML = `<div class="text-success fw-bold"><i class="bi bi-check-circle"></i> Correct! ${drill.explanation}</div>`;
        } else {
            feedback.innerHTML = `<div class="text-danger fw-bold"><i class="bi bi-x-circle"></i> Incorrect. ${drill.explanation}</div>`;
        }

        setTimeout(() => {
            this.currentIndex++;
            this.render();
        }, 2500);
    },

    renderComplete() {
        this.container.innerHTML = `
            <div class="text-center p-5 fade-in">
                <div class="mb-4">
                    <i class="bi bi-trophy text-warning display-1"></i>
                </div>
                <h2 class="mb-3">Quiz Complete!</h2>
                <p class="lead text-muted">You finished the particle drills.</p>
                <button class="btn btn-primary btn-lg mt-4 px-5" onclick="window.navigateApp('home')">Finish</button>
            </div>
        `;
    }
};
