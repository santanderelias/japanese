/**
 * Statistics Tracker Module
 * Manages persistence of user performance data in localStorage.
 */

const STATS_KEY = 'japanese_app_stats';

export function recordAnswer(wordId, isCorrect) {
    const stats = getStats();
    
    // Global stats
    stats.totalAnswers = (stats.totalAnswers || 0) + 1;
    if (isCorrect) {
        stats.totalCorrect = (stats.totalCorrect || 0) + 1;
    }

    // Per-word stats
    if (!stats.words) stats.words = {};
    if (!stats.words[wordId]) {
        stats.words[wordId] = { correct: 0, wrong: 0, lastSeen: null };
    }

    const wordStats = stats.words[wordId];
    if (isCorrect) {
        wordStats.correct++;
    } else {
        wordStats.wrong++;
    }
    wordStats.lastSeen = Date.now();

    saveStats(stats);
}

export function getStats() {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : { totalAnswers: 0, totalCorrect: 0, words: {} };
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
