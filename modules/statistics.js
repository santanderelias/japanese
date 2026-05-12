import { getStats } from './statsTracker.js';

let displayLimit = 5;

export async function initStatistics() {
    displayLimit = 5; // Reset limit on each entry
    const allCards = window.allCardsData || [];
    const stats = getStats();
    
    renderStatistics(allCards, stats);
}

function renderStatistics(allCards, stats) {
    const container = document.getElementById('statistics-container');
    
    // Process word-specific data
    const wordData = allCards.map(card => {
        const wordStats = stats.words[String(card.id)] || { correct: 0, wrong: 0, interval: 0 };
        const total = wordStats.correct + wordStats.wrong;
        const score = total > 0 ? (wordStats.correct / total) : null;
        return { ...card, stats: wordStats, total, score };
    });

    // Sort by problematic first (Highest WRONG count first)
    const sortedWords = wordData
        .filter(w => w.total > 0)
        .sort((a, b) => b.stats.wrong - a.stats.wrong || a.score - b.score);

    const visibleWords = sortedWords.slice(0, displayLimit);
    const hasMore = sortedWords.length > displayLimit;

    container.innerHTML = `
        <h4 class="mb-3">Word Performance</h4>
        <div class="list-group mb-4">
            ${visibleWords.length > 0 ? visibleWords.map(word => {
                const percent = Math.round(word.score * 100);
                const colorClass = percent < 40 ? 'bg-danger' : (percent < 70 ? 'bg-warning' : 'bg-success');
                const isDue = word.stats.dueDate && word.stats.dueDate <= Date.now();
                
                return `
                    <div class="list-group-item bg-body-tertiary border-0 mb-2 rounded p-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <span class="fw-bold fs-5">${word.kanji || word.reading}</span>
                                <span class="ms-2 small opacity-75">${word.reading !== word.kanji ? word.reading : ''}</span>
                                ${isDue ? '<span class="badge bg-primary ms-2">Due</span>' : ''}
                            </div>
                            <span class="badge ${colorClass}">${percent}%</span>
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${percent}%"></div>
                        </div>
                        <div class="mt-2 d-flex justify-content-between small opacity-50">
                            <span>Correct: ${word.stats.correct} | Wrong: ${word.stats.wrong}</span>
                            <span>Interval: ${word.stats.interval || 0}d</span>
                        </div>
                    </div>
                `;
            }).join('') : '<div class="text-center p-4 opacity-50">Keep practicing to see stats!</div>'}
        </div>

        ${hasMore ? `
            <div class="text-center mb-4">
                <button class="btn btn-outline-primary w-100 py-3" id="btn-show-more-stats">
                    Show More (5)
                </button>
            </div>
        ` : ''}
    `;

    if (hasMore) {
        document.getElementById('btn-show-more-stats').addEventListener('click', () => {
            displayLimit += 5;
            renderStatistics(allCards, stats);
        });
    }
}

window.initStatistics = initStatistics;
