import { getStats } from './statsTracker.js';

export async function initStatistics() {
    const response = await fetch('data.json');
    const allCards = await response.json();
    const stats = getStats();
    
    renderStatistics(allCards, stats);
}

function renderStatistics(allCards, stats) {
    const container = document.getElementById('statistics-container');
    
    // Calculate global metrics
    const totalAnswers = stats.totalAnswers || 0;
    const totalCorrect = stats.totalCorrect || 0;
    const accuracy = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
    
    // Process word-specific data
    const wordData = allCards.map(card => {
        const wordStats = stats.words[card.id] || { correct: 0, wrong: 0 };
        const total = wordStats.correct + wordStats.wrong;
        const score = total > 0 ? (wordStats.correct / total) : null;
        return { ...card, stats: wordStats, total, score };
    });

    // Sort by problematic first (lowest score, but only if seen at least once)
    const problematicWords = [...wordData]
        .filter(w => w.total > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 10); // Show top 10 problematic

    container.innerHTML = `
        <!-- Global Summary -->
        <div class="row g-3 mb-4">
            <div class="col-6">
                <div class="card h-100 text-center p-3 bg-body-tertiary border-0">
                    <div class="h3 mb-0">${accuracy}%</div>
                    <div class="small opacity-75">Accuracy</div>
                </div>
            </div>
            <div class="col-6">
                <div class="card h-100 text-center p-3 bg-body-tertiary border-0">
                    <div class="h3 mb-0">${totalAnswers}</div>
                    <div class="small opacity-75">Attempts</div>
                </div>
            </div>
        </div>

        <!-- Problematic Words Section -->
        <h4 class="mb-3">Problematic Words</h4>
        <div class="list-group mb-4">
            ${problematicWords.length > 0 ? problematicWords.map(word => {
                const percent = Math.round(word.score * 100);
                const colorClass = percent < 40 ? 'bg-danger' : (percent < 70 ? 'bg-warning' : 'bg-success');
                return `
                    <div class="list-group-item bg-body-tertiary border-0 mb-2 rounded p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <span class="fw-bold fs-5">${word.kanji || word.reading}</span>
                                <span class="ms-2 small opacity-75">${word.reading !== word.kanji ? word.reading : ''}</span>
                            </div>
                            <span class="badge ${colorClass}">${percent}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${percent}%"></div>
                        </div>
                        <div class="mt-2 small opacity-50">
                            Correct: ${word.stats.correct} | Wrong: ${word.stats.wrong}
                        </div>
                    </div>
                `;
            }).join('') : '<div class="text-center p-4 opacity-50">Keep practicing to see stats!</div>'}
        </div>

        <!-- All Words List -->
        <h4 class="mb-3">All Word Performance</h4>
        <div class="list-group">
            ${wordData.filter(w => w.total > 0).sort((a,b) => b.total - a.total).map(word => {
                const percent = Math.round(word.score * 100);
                return `
                    <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-bottom px-0">
                        <span>${word.kanji || word.reading}</span>
                        <span class="small">${percent}% (${word.total})</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.initStatistics = initStatistics;
