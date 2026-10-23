/**
 * storage.js — LocalStorage manager with export/import support.
 */

const STORAGE_KEY_PROGRESS = 'jp_app_progress';
const STORAGE_KEY_SETTINGS = 'jp_app_settings';
const STORAGE_KEY_CUSTOM_DATASETS = 'jp_app_custom_datasets';

export class StorageManager {
  constructor() {
    this.progress = this.loadProgress();
    this.settings = this.loadSettings();
    this.customDatasets = this.loadCustomDatasets();
  }

  getDefaultProgress() {
    return {
      masteredWords: [], // list of word japanese strings
      needsReviewWords: [],
      streak: 0,
      lastActiveDate: null,
      quizStats: {
        taken: 0,
        correct: 0,
        totalQuestions: 0,
        history: [] // { date, score, total, mode }
      },
      gameStats: {
        memory: { played: 0, bestTimeSec: null },
        unscramble: { played: 0, solved: 0 },
        crossword: { played: 0, solvedLevels: [] }
      }
    };
  }

  getDefaultSettings() {
    return {
      theme: 'light',
      selectedTopics: [], // Empty array means ALL topics selected
      activeDatasetIds: ['marugoto_a1'], // list of active datasets
      furiganaMode: 'show', // 'show', 'hide', 'ruby'
      audioVolume: 1.0,
      speechRate: 1.0
    };
  }

  loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      return raw ? { ...this.getDefaultProgress(), ...JSON.parse(raw) } : this.getDefaultProgress();
    } catch {
      return this.getDefaultProgress();
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return raw ? { ...this.getDefaultSettings(), ...JSON.parse(raw) } : this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  }

  saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  loadCustomDatasets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_DATASETS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  saveCustomDatasets(datasets) {
    this.customDatasets = datasets;
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_DATASETS, JSON.stringify(datasets));
    } catch (e) {
      console.error('Failed to save custom datasets', e);
    }
  }

  /**
   * Record practice activity to maintain streak
   */
  recordActivity() {
    const today = new Date().toISOString().split('T')[0];
    if (this.progress.lastActiveDate === today) return;

    if (this.progress.lastActiveDate) {
      const last = new Date(this.progress.lastActiveDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        this.progress.streak += 1;
      } else if (diffDays > 1) {
        this.progress.streak = 1;
      }
    } else {
      this.progress.streak = 1;
    }
    this.progress.lastActiveDate = today;
    this.saveProgress();
  }

  toggleWordMastered(japanese) {
    const idx = this.progress.masteredWords.indexOf(japanese);
    if (idx >= 0) {
      this.progress.masteredWords.splice(idx, 1);
    } else {
      this.progress.masteredWords.push(japanese);
      // Remove from needs review if present
      const rIdx = this.progress.needsReviewWords.indexOf(japanese);
      if (rIdx >= 0) this.progress.needsReviewWords.splice(rIdx, 1);
    }
    this.recordActivity();
    this.saveProgress();
  }

  isWordMastered(japanese) {
    return this.progress.masteredWords.includes(japanese);
  }

  toggleNeedsReview(japanese) {
    const idx = this.progress.needsReviewWords.indexOf(japanese);
    if (idx >= 0) {
      this.progress.needsReviewWords.splice(idx, 1);
    } else {
      this.progress.needsReviewWords.push(japanese);
      // Remove from mastered if present
      const mIdx = this.progress.masteredWords.indexOf(japanese);
      if (mIdx >= 0) this.progress.masteredWords.splice(mIdx, 1);
    }
    this.recordActivity();
    this.saveProgress();
  }

  isNeedsReview(japanese) {
    return this.progress.needsReviewWords.includes(japanese);
  }

  recordQuizResult(score, total, mode) {
    this.progress.quizStats.taken += 1;
    this.progress.quizStats.correct += score;
    this.progress.quizStats.totalQuestions += total;
    this.progress.quizStats.history.unshift({
      date: new Date().toISOString(),
      score,
      total,
      mode
    });
    if (this.progress.quizStats.history.length > 20) {
      this.progress.quizStats.history.pop();
    }
    this.recordActivity();
    this.saveProgress();
  }

  recordMemoryGame(timeSec) {
    this.progress.gameStats.memory.played += 1;
    if (
      this.progress.gameStats.memory.bestTimeSec === null ||
      timeSec < this.progress.gameStats.memory.bestTimeSec
    ) {
      this.progress.gameStats.memory.bestTimeSec = timeSec;
    }
    this.recordActivity();
    this.saveProgress();
  }

  recordUnscrambleGame(solved) {
    this.progress.gameStats.unscramble.played += 1;
    if (solved) this.progress.gameStats.unscramble.solved += 1;
    this.recordActivity();
    this.saveProgress();
  }

  recordCrosswordSolved(levelId) {
    this.progress.gameStats.crossword.played += 1;
    if (!this.progress.gameStats.crossword.solvedLevels.includes(levelId)) {
      this.progress.gameStats.crossword.solvedLevels.push(levelId);
    }
    this.recordActivity();
    this.saveProgress();
  }

  exportAllData() {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        progress: this.progress,
        settings: this.settings,
        customDatasets: this.customDatasets
      },
      null,
      2
    );
  }

  importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.progress) {
        this.progress = { ...this.getDefaultProgress(), ...data.progress };
        this.saveProgress();
      }
      if (data.settings) {
        this.settings = { ...this.getDefaultSettings(), ...data.settings };
        this.saveSettings();
      }
      if (data.customDatasets && Array.isArray(data.customDatasets)) {
        this.saveCustomDatasets(data.customDatasets);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  resetAllProgress() {
    this.progress = this.getDefaultProgress();
    this.saveProgress();
  }
}

export const storage = new StorageManager();
