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
                <div class="col-md-3 mb-4">
                    <div class="list-group shadow-sm sticky-top" style="top: 100px;" id="study-list-tab" role="tablist">
                        <a class="list-group-item list-group-item-action active border-0 py-3" id="list-guides-list" data-bs-toggle="list" href="#list-guides" role="tab">
                            <i class="bi bi-journal-text me-2"></i>Grammar Guides
                        </a>
                        <a class="list-group-item list-group-item-action border-0 py-3" id="list-vocab-list" data-bs-toggle="list" href="#list-vocab" role="tab">
                            <i class="bi bi-translate me-2"></i>Vocabulary List
                        </a>
                    </div>
                </div>
                <div class="col-md-9">
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
                                    <div id="vocab-table-container">
                                        ${this.renderVocabTable(this.data.vocabulary)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

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

    renderVocabTable(vocabList) {
        if (!vocabList || vocabList.length === 0) return '<p class="text-muted">No words found.</p>';

        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        const sorted = [...vocabList].sort((a, b) => {
            const pa = priorityOrder[a.priority] || 4;
            const pb = priorityOrder[b.priority] || 4;
            return pa - pb;
        });

        return `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Kanji</th>
                            <th>Kana</th>
                            <th>Polite</th>
                            <th>Group</th>
                            <th>Meaning</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(word => `
                            <tr>
                                <td class="fw-bold text-primary fs-5 text-nowrap">${word.kanji}</td>
                                <td class="text-nowrap">${word.romaji || word.kana || '-'}</td>
                                <td class="text-nowrap">${word.polite}</td>
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
                document.getElementById('vocab-table-container').innerHTML = this.renderVocabTable(filtered);
            });
        }
    }
};
