/**
 * Statistics Tracker Module
 * Manages persistence of user performance data in localStorage.
 */

const STATS_KEY = 'japanese_app_stats';

export function recordAnswer(wordId, isCorrect, weight = 1.0) {
    if (!wordId) return;
    
    const stats = getStats();
    
    // Ensure structure exists
    if (!stats.words) stats.words = {};

    // Per-word stats
    if (!stats.words[wordId]) {
        stats.words[wordId] = { 
            correct: 0, 
            wrong: 0, 
            lastSeen: null,
            interval: 0,
            ease: 2.5,
            dueDate: 0,
            streak: 0
        };
    }

    const wordStats = stats.words[wordId];
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (isCorrect) {
        wordStats.correct += weight;
        
        // Only increase streak and interval if no reading hint was used (weight === 1.0)
        if (weight >= 1.0) {
            wordStats.streak++;
            if (wordStats.streak === 1) {
                wordStats.interval = 1;
            } else if (wordStats.streak === 2) {
                wordStats.interval = 6;
            } else {
                wordStats.interval = Math.round(wordStats.interval * wordStats.ease);
            }
        } else {
            // Hint used: word is "known" but not mastered. Keep streak but don't advance interval much.
            // Or reset streak if you want them to see it sooner.
            wordStats.streak = 0; 
            wordStats.interval = 1; // Show again tomorrow
        }
        
        wordStats.dueDate = now + (wordStats.interval * dayInMs);
    } else {
        wordStats.wrong++;
        wordStats.streak = 0;
        wordStats.interval = 0; // Review soon
        wordStats.dueDate = now;
        wordStats.ease = Math.max(1.3, wordStats.ease - 0.2);
    }
    
    wordStats.lastSeen = now;

    saveStats(stats);
}

export function getStats() {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : { totalAnswers: 0, totalCorrect: 0, words: {} };
}

function saveStats(stats) {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}
