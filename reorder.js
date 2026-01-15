import { StatsModule } from './stats.js';

export const ReorderModule = {
    data: [],
    currentIndex: 0,
    container: null,
    currentSelection: [],

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
        this.currentSelection = [];

        this.container.innerHTML = `
            <div class="container fade-in" style="max-width: 600px;">
                <div class="card shadow-sm border-0 mt-4">
                    <div class="card-body p-4">
                         <div class="d-flex justify-content-between align-items-center mb-4">
                             <span class="badge bg-light text-muted border">Sentence ${this.currentIndex + 1} / ${this.data.length}</span>
                         </div>
                         
                         <h5 class="text-center text-muted mb-4 opacity-75">Construct:</h5>
                         <h4 class="text-center mb-5">"${drill.meaning}"</h4>

                         <!-- Answer Area -->
                         <div id="drop-zone" class="p-4 bg-light rounded-3 mb-4 d-flex flex-wrap gap-2 justify-content-center align-items-center" style="min-height: 80px; border: 2px dashed #e0e0e0;">
                         </div>

                         <!-- Word Bank -->
                         <div id="word-bank" class="d-flex flex-wrap justify-content-center gap-2 mt-2">
                            ${this.shuffle(drill.parts).map((word, idx) => `
                                <button class="btn btn-outline-primary word-chip px-3 py-2" data-word="${word}" data-idx="${idx}">${word}</button>
                            `).join('')}
                         </div>
                    </div>
                </div>
                
                <div class="text-center mt-4">
                    <button class="btn btn-outline-secondary me-2 px-4" id="undo-btn" disabled><i class="bi bi-arrow-counterclockwise"></i> Undo</button>
                    <button class="btn btn-success px-5" id="confirm-btn" disabled>Check Answer</button>
                </div>
            </div>
        `;

        this.attachListeners(drill);
    },

    shuffle(array) {
        return [...array].sort(() => Math.random() - 0.5);
    },

    attachListeners(drill) {
        const chips = this.container.querySelectorAll('.word-chip');
        const dropZone = document.getElementById('drop-zone');
        const confirmBtn = document.getElementById('confirm-btn');
        const undoBtn = document.getElementById('undo-btn');

        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                if (chip.disabled) return;

                chip.disabled = true;
                chip.classList.add('opacity-50');

                const word = chip.dataset.word;
                this.currentSelection.push(word);

                const selectedChip = document.createElement('span');
                selectedChip.className = 'badge bg-primary fs-6 p-2 fw-normal';
                selectedChip.innerText = word;
                dropZone.appendChild(selectedChip);

                undoBtn.disabled = false;
                confirmBtn.disabled = this.currentSelection.length !== drill.parts.length;
            });
        });

        undoBtn.addEventListener('click', () => {
            if (this.currentSelection.length === 0) return;

            const lastWord = this.currentSelection.pop();
            dropZone.removeChild(dropZone.lastChild);

            const bankChip = Array.from(chips).find(c => c.dataset.word === lastWord && c.disabled);
            if (bankChip) {
                bankChip.disabled = false;
                bankChip.classList.remove('opacity-50');
            }

            undoBtn.disabled = this.currentSelection.length === 0;
            confirmBtn.disabled = true;
        });

        confirmBtn.addEventListener('click', () => {
            const userSentence = this.currentSelection.join('');
            const correctSentence = drill.correct_order.join('');

            if (userSentence === correctSentence) {
                StatsModule.addXP(15);
                dropZone.style.borderColor = '#2eea78';
                dropZone.style.backgroundColor = '#e8fdf0';
                confirmBtn.innerText = 'Correct!';
                setTimeout(() => {
                    this.currentIndex++;
                    this.render();
                }, 1500);
            } else {
                dropZone.style.borderColor = '#ea2e2e';
                dropZone.style.backgroundColor = '#fde8e8';

                dropZone.animate([
                    { transform: 'translate(1px, 1px) rotate(0deg)' },
                    { transform: 'translate(-1px, -2px) rotate(-1deg)' },
                    { transform: 'translate(-3px, 0px) rotate(1deg)' },
                    { transform: 'translate(3px, 2px) rotate(0deg)' },
                    { transform: 'translate(1px, -1px) rotate(1deg)' }
                ], { duration: 500 });
            }
        });
    },

    renderComplete() {
        this.container.innerHTML = `
            <div class="text-center p-5 fade-in">
                <div class="mb-4">
                     <i class="bi bi-stars text-warning display-1"></i>
                </div>
                <h2 class="mb-3">Great Job!</h2>
                <p class="lead text-muted">You reconstructed all sentences.</p>
                <button class="btn btn-primary btn-lg mt-4 px-5" onclick="window.navigateApp('home')">Finish</button>
            </div>
        `;
    }
};
