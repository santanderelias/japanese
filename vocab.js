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
