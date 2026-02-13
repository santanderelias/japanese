import { VocabModule } from './vocab.js';

export const LearningModule = {
    modal: null,
    data: null, // Will hold the whole data object

    init(data) {
        this.data = data;
        const el = document.getElementById('learning-modal');
        if (el && window.bootstrap) {
            this.modal = new bootstrap.Modal(el);
        }
    },

    show(context) {
        if (!this.modal) return;

        // 1. Set Title
        const titleMap = {
            'filler': 'Verb Conjugation Guide',
            'particles': 'Particle Guide',
            'reorder': 'Sentence Structure Guide',
            'kanji': 'Kanji Guide',
            'vocab': 'Vocabulary Guide'
        };
        document.getElementById('learning-modal-title').innerText = titleMap[context] || 'Learning Guide';

        // 2. Populate Guide Tab
        const guideContent = this.data.guides[context] || '<p>No specific guide for this section.</p>';
        document.getElementById('guide-tab-pane').innerHTML = guideContent;

        // 3. Populate Vocab Tab (Reuse VocabModule logic if possible, or simple render)
        // We can just render the table into the vocab pane
        const vocabContainer = document.getElementById('vocab-tab-pane');
        vocabContainer.innerHTML = ''; // clear

        // We need a slight hack to use VocabModule inside the modal without breaking its main page usage
        // Or we just re-implement a simple list here. Let's re-implement a simple list for the modal to be safe/lighter.
        this.renderVocabList(vocabContainer);

        // 4. Show default tab (Guide)
        const guideTabBtn = document.getElementById('guide-tab');
        const guideTab = new bootstrap.Tab(guideTabBtn);
        guideTab.show();

        this.modal.show();
    },

    renderVocabList(container) {
        const vocab = this.data.vocabulary;
        // Simple list view
        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-striped">
                    <thead>
                        <tr><th>Kanji</th><th>Reading</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        ${vocab.map(v => `
                            <tr>
                                <td class="fw-bold text-primary">${v.kanji}</td>
                                <td>${v.romaji}</td>
                                <td>${v.meaning}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};
