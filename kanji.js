import { StatsModule } from './stats.js';

export const KanjiModule = {
    data: [],
    container: null,
    selectedKanji: null,
    selectedKana: null,
    matchedPairs: 0,

    init(drills, container) {
        this.data = drills;
        this.container = container;
        this.matchedPairs = 0;
        this.render();
    },

    render() {
        const kanjiList = [...this.data].sort(() => Math.random() - 0.5);
        const kanaList = [...this.data].sort(() => Math.random() - 0.5);

        this.container.innerHTML = `
            <div class="container fade-in" style="max-width: 800px;">
                <div class="text-center mb-5 mt-3">
                    <p class="text-muted">Tap a Kanji, then tap its matching Reading (Kana).</p>
                </div>

                <div class="row g-4">
                    <!-- Kanji Column -->
                    <div class="col-6">
                        <div class="d-grid gap-3">
                            ${kanjiList.map(item => `
                                <button class="btn btn-outline-dark btn-lg kanji-btn py-3 shadow-sm" data-id="${item.id}" style="font-size: 1.5rem;">
                                    ${item.kanji}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Kana Column -->
                    <div class="col-6">
                         <div class="d-grid gap-3">
                            ${kanaList.map(item => `
                                <button class="btn btn-outline-secondary btn-lg kana-btn py-3 shadow-sm" data-id="${item.id}" style="font-size: 1.25rem;">
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
                if (btn.classList.contains('btn-success')) return;

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
                if (btn.classList.contains('btn-success')) return;

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

            if (id1 === id2) {
                // Match!
                this.selectedKanji.classList.remove('btn-primary', 'active', 'btn-outline-dark');
                this.selectedKanji.classList.add('btn-success', 'text-white', 'border-success');
                this.selectedKana.classList.remove('btn-primary', 'active', 'btn-outline-secondary');
                this.selectedKana.classList.add('btn-success', 'text-white', 'border-success');

                this.selectedKanji = null;
                this.selectedKana = null;
                this.matchedPairs++;
                StatsModule.addXP(5);

                this.checkWin();
            } else {
                // Incorrect
                this.selectedKanji.classList.add('btn-danger', 'text-white');
                this.selectedKana.classList.add('btn-danger', 'text-white');

                setTimeout(() => {
                    this.selectedKanji?.classList.remove('btn-danger', 'text-white', 'active', 'btn-primary');
                    this.selectedKana?.classList.remove('btn-danger', 'text-white', 'active', 'btn-primary');
                    this.selectedKanji = null;
                    this.selectedKana = null;
                }, 500);
            }
        }
    },

    checkWin() {
        if (this.matchedPairs >= this.data.length) {
            setTimeout(() => {
                this.container.innerHTML = `
                    <div class="text-center p-5 fade-in">
                         <div class="mb-4">
                            <i class="bi bi-flower1 text-danger display-1"></i>
                         </div>
                        <h2 class="mb-3">Excellent!</h2>
                        <p class="lead text-muted">All Kanji matched.</p>
                        <button class="btn btn-primary btn-lg mt-4 px-5" onclick="window.navigateApp('home')">Finish</button>
                    </div>
                `;
            }, 500);
        }
    }
};
