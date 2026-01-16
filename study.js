import { VocabModule } from './vocab.js';
// Actually, let's implement the Vocab logic directly here or import a cleaner version if we had one.
// Since VocabModule in filler.js was simple, I will re-implement the table logic here for better control and separation.

export const StudyModule = {
    data: null,
    container: null,

    init(data, container) {
        this.data = data;
        this.container = container;
        this.render();
    },

    render() {
        this.container.innerHTML = `
            <div class="row fade-in">
                <!-- Mobile Menu (List Group - Original Layout) -->
                <div class="col-12 d-md-none mb-4">
                     <div class="list-group shadow-sm" id="study-list-tab-mobile" role="tablist">
                        <a class="list-group-item list-group-item-action active border-0 py-3" id="list-guides-list-mobile" data-bs-toggle="list" href="#list-guides" role="tab">
                            <i class="bi bi-journal-text me-2"></i>Grammar Guides
                        </a>
                        <a class="list-group-item list-group-item-action border-0 py-3" id="list-vocab-list-mobile" data-bs-toggle="list" href="#list-vocab" role="tab">
                            <i class="bi bi-translate me-2"></i>Vocabulary List
                        </a>
                    </div>
                </div>

                <!-- Desktop Menu (Tabs - New Layout) -->
                <div class="col-12 d-none d-md-block mb-4">
                    <ul class="nav nav-pills nav-fill bg-white shadow-sm rounded p-2" id="study-tab-desktop" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active fw-bold" id="list-guides-tab-desktop" data-bs-toggle="tab" data-bs-target="#list-guides" type="button" role="tab">
                                <i class="bi bi-journal-text me-2"></i>Grammar Guides
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-bold" id="list-vocab-tab-desktop" data-bs-toggle="tab" data-bs-target="#list-vocab" type="button" role="tab">
                                <i class="bi bi-translate me-2"></i>Vocabulary List
                            </button>
                        </li>
                    </ul>
                </div>

                <div class="col-12">
                    <div class="tab-content" id="nav-tabContent">
                        <!-- Grammar Guides Panel -->
                        <div class="tab-pane fade show active" id="list-guides" role="tabpanel">
                            <div class="card shadow-sm border-0 mb-4 correct-animation">
                                <div class="card-body p-4">
                                     <h2 class="mb-4 text-primary">Grammar Guides</h2>
                                     <div class="accordion" id="guidesAccordion">
                                        ${this.renderAccordionItem('headingOne', 'collapseOne', 'Verb Conjugation', this.data.guides.filler, false)}
                                        ${this.renderAccordionItem('headingTwo', 'collapseTwo', 'Particles', this.data.guides.particles)}
                                        ${this.renderAccordionItem('headingThree', 'collapseThree', 'Sentence Structure', this.data.guides.reorder)}
                                        ${this.renderAccordionItem('headingFour', 'collapseFour', 'Kanji Readings', this.data.guides.kanji)}
                                     </div>
                                </div>
                            </div>
                        </div>

                        <!-- Vocabulary Panel -->
                        <div class="tab-pane fade" id="list-vocab" role="tabpanel">
                            <div class="card shadow-sm border-0">
                                <div class="card-body p-4">
                                    <h2 class="mb-4 text-primary">Vocabulary Database</h2>
                                    <div class="input-group mb-3">
                                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                                        <input type="text" class="form-control border-start-0" id="vocab-search" placeholder="Search meanings, romaji, or kanji...">
                                    </div>
                                    <div id="vocab-table-container"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render Vocab using the dedicated module (Dual View)
        const vocabContainer = document.getElementById('vocab-table-container');
        if (vocabContainer) {
            VocabModule.init(this.data.vocabulary, vocabContainer);
        }

        this.attachSearchListener();
    },

    renderAccordionItem(id, target, title, content, isOpen = false) {
        return `
            <div class="accordion-item border-0 mb-3 shadow-sm rounded overflow-hidden">
                <h2 class="accordion-header" id="${id}">
                    <button class="accordion-button ${isOpen ? '' : 'collapsed'} fw-bold bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#${target}" aria-expanded="${isOpen}">
                        ${title}
                    </button>
                </h2>
                <div id="${target}" class="accordion-collapse collapse ${isOpen ? 'show' : ''}" aria-labelledby="${id}" data-bs-parent="#guidesAccordion">
                    <div class="accordion-body bg-white p-4">
                        ${content || 'No content available.'}
                    </div>
                </div>
            </div>
        `;
    },

    attachSearchListener() {
        const searchInput = document.getElementById('vocab-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.data.vocabulary.filter(v =>
                    v.kanji.includes(term) ||
                    v.meaning.toLowerCase().includes(term) ||
                    (v.romaji && v.romaji.toLowerCase().includes(term)) ||
                    (v.kana && v.kana.includes(term))
                );
                const container = document.getElementById('vocab-table-container');
                VocabModule.init(filtered, container);
            });
        }
    }
};
