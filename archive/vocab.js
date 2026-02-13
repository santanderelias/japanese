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

        container.innerHTML = '';
        this.renderTable(container);
        this.renderMobileCards(container);
    },

    renderTable(container) {
        // Desktop View (Table)
        const desktopView = `
            <div class="d-none d-md-block table-responsive fade-in">
                <table class="table table-hover align-middle bg-white shadow-sm rounded">
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
        container.insertAdjacentHTML('beforeend', desktopView);
    },

    renderMobileCards(container) {
        // Mobile View (Cards)
        const mobileView = `
            <div class="d-md-none fade-in">
                <div class="row g-3">
                    ${this.data.map(word => `
                        <div class="col-12">
                            <div class="card shadow-sm border-0">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h2 class="h1 text-primary mb-0 fw-bold">${word.kanji}</h2>
                                            <div class="text-muted small">${word.romaji || word.kana}</div>
                                        </div>
                                        ${this.getPriorityBadge(word.priority)}
                                    </div>
                                    
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="badge bg-light text-dark border">G${word.group}</span>
                                        <div class="fw-bold">${word.polite}</div>
                                    </div>
                                    
                                    <div class="border-top pt-2 mt-2 text-secondary">
                                        ${word.meaning}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', mobileView);
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
