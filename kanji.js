import { StatsModule } from './stats.js';

export const KanjiModule = {
    fullData: [],
    currentStageData: [],
    container: null,
    selectedKanji: null,
    selectedKana: null,
    matchedInStage: 0,
    currentStage: 0,
    STAGE_SIZE: 5,

    init(drills, container) {
        // Shuffle full data once
        this.fullData = [...drills].sort(() => Math.random() - 0.5);
        this.container = container;
        this.currentStage = 0;
        this.startStage();
    },

    startStage() {
        const start = this.currentStage * this.STAGE_SIZE;
        const end = start + this.STAGE_SIZE;

        if (start >= this.fullData.length) {
            this.showVictory();
            return;
        }

        this.currentStageData = this.fullData.slice(start, end);
        this.matchedInStage = 0;
        this.selectedKanji = null;
        this.selectedKana = null;
        this.render();
    },

    render() {
        // Shuffle columns independently for the stage
        const kanjiList = [...this.currentStageData].sort(() => Math.random() - 0.5);
        const kanaList = [...this.currentStageData].sort(() => Math.random() - 0.5);

        const progressPercent = ((this.currentStage * this.STAGE_SIZE) / this.fullData.length) * 100;

        this.container.innerHTML = `
            <div class="container fade-in" style="max-width: 800px;">
                <div class="d-flex justify-content-between align-items-center mb-4 mt-3">
                    <h4 class="mb-0">Stage ${this.currentStage + 1}</h4>
                    <span class="text-muted small">${Math.min(this.fullData.length, (this.currentStage + 1) * this.STAGE_SIZE)} / ${this.fullData.length} Kanji</span>
                </div>
                
                <div class="progress mb-4" style="height: 6px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${progressPercent}%"></div>
                </div>

                <div class="text-center mb-4">
                    <p class="text-muted">Tap a Kanji, then tap its matching Reading.</p>
                </div>

                <div class="row g-4">
                     <!-- Kanji Column -->
                    <div class="col-6">
                        <div class="d-grid gap-3">
                            ${kanjiList.map(item => `
                                <button class="btn btn-outline-dark kanji-btn shadow-sm d-flex align-items-center justify-content-center" 
                                    data-id="${item.id}" 
                                    style="height: 80px; font-size: 2rem;">
                                    ${item.kanji}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Kana Column -->
                    <div class="col-6">
                         <div class="d-grid gap-3">
                            ${kanaList.map(item => `
                                <button class="btn btn-outline-secondary kana-btn shadow-sm d-flex align-items-center justify-content-center" 
                                    data-id="${item.id}" 
                                    style="height: 80px; font-size: 1.1rem;">
                                    ${item.kana}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachListeners();
    },

    attachListeners() {
        const kBtns = this.container.querySelectorAll('.kanji-btn');
        const rBtns = this.container.querySelectorAll('.kana-btn');

        kBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('btn-success') || btn.disabled) return;

                kBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
                if (this.selectedKanji !== btn) {
                    btn.classList.add('active', 'btn-primary');
                    this.selectedKanji = btn;
                    this.checkMatch();
                } else {
                    this.selectedKanji = null;
                }
            });
        });

        rBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('btn-success') || btn.disabled) return;

                rBtns.forEach(b => b.classList.remove('active', 'btn-primary'));
                if (this.selectedKana !== btn) {
                    btn.classList.add('active', 'btn-primary');
                    this.selectedKana = btn;
                    this.checkMatch();
                } else {
                    this.selectedKana = null;
                }
            });
        });
    },

    checkMatch() {
        if (this.selectedKanji && this.selectedKana) {
            const id1 = this.selectedKanji.dataset.id;
            const id2 = this.selectedKana.dataset.id;

            // Disable clicks while checking
            const allBtns = this.container.querySelectorAll('button');
            allBtns.forEach(b => b.disabled = true);

            if (id1 === id2) {
                // Match!
                this.selectedKanji.className = 'btn btn-success text-white shadow-sm d-flex align-items-center justify-content-center';
                this.selectedKana.className = 'btn btn-success text-white shadow-sm d-flex align-items-center justify-content-center';

                // Keep styling
                this.selectedKanji.style.height = '80px';
                this.selectedKanji.style.fontSize = '2rem';
                this.selectedKana.style.height = '80px';
                this.selectedKana.style.fontSize = '1.1rem';

                this.selectedKanji = null;
                this.selectedKana = null;
                this.matchedInStage++;
                StatsModule.addXP(5);

                // Re-enable unmatched buttons
                allBtns.forEach(b => {
                    if (!b.classList.contains('btn-success')) b.disabled = false;
                });

                if (this.matchedInStage >= this.currentStageData.length) {
                    setTimeout(() => {
                        this.currentStage++;
                        this.startStage();
                    }, 1000);
                }

            } else {
                // Incorrect
                this.selectedKanji.classList.add('btn-danger', 'text-white');
                this.selectedKana.classList.add('btn-danger', 'text-white');

                setTimeout(() => {
                    this.selectedKanji?.classList.remove('btn-danger', 'text-white', 'active', 'btn-primary');
                    this.selectedKana?.classList.remove('btn-danger', 'text-white', 'active', 'btn-primary');
                    this.selectedKanji = null;
                    this.selectedKana = null;

                    // Re-enable unmatched buttons
                    allBtns.forEach(b => {
                        if (!b.classList.contains('btn-success')) b.disabled = false;
                    });
                }, 800);
            }
        }
    },

    showVictory() {
        this.container.innerHTML = `
            <div class="text-center p-5 fade-in">
                    <div class="mb-4">
                    <i class="bi bi-flower1 text-danger display-1"></i>
                    </div>
                <h2 class="mb-3">Masterful!</h2>
                <p class="lead text-muted">You have completed all Kanji stages.</p>
                <div class="mt-4">
                    <button class="btn btn-outline-secondary me-2" onclick="window.navigateApp('home')">Back to Menu</button>
                    <button class="btn btn-primary px-4" onclick="window.navigateApp('kanji')">Play Again</button>
                </div>
            </div>
        `;
    }
};
