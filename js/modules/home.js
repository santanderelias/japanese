/**
 * Home Module (0) — Dashboard with overview, study streak, daily word, quick links.
 */

import { Module } from './base.js';
import { storage } from '../storage.js';
import { dataManager } from '../data.js';
import { audioPlayer } from '../audio.js';

export class HomeModule extends Module {
  constructor(orchestrator) {
    super({
      id: 0,
      name: 'Dashboard',
      navLabel: 'ホーム',
      navOrder: 0
    });
    this.orchestrator = orchestrator;
    this.dailyWord = null;
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-go]');
      if (btn) {
        const id = Number(btn.getAttribute('data-go'));
        if (!isNaN(id)) this.orchestrator.show(id);
      }

      const audioBtn = e.target.closest('[data-action="play-daily-audio"]');
      if (audioBtn && this.dailyWord) {
        audioPlayer.play(this.dailyWord.japanese);
      }

      const toggleMasteredBtn = e.target.closest('[data-action="toggle-daily-mastered"]');
      if (toggleMasteredBtn && this.dailyWord) {
        storage.toggleWordMastered(this.dailyWord.japanese);
        this.refreshStats();
      }
    });
  }

  show() {
    super.show();
    this.refreshStats();
  }

  refreshStats() {
    if (!this.element) return;
    const words = dataManager.getWords();
    const totalWords = words.length;
    const masteredCount = storage.progress.masteredWords.length;
    const streak = storage.progress.streak || 0;
    const pct = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

    // Pick daily word deterministically based on date if not already picked
    if (!this.dailyWord && words.length > 0) {
      const dayHash = new Date().toISOString().slice(0, 10).split('-').reduce((a, b) => Number(a) + Number(b), 0);
      this.dailyWord = words[dayHash % words.length];
    }

    const streakEl = this.element.querySelector('#dash-streak');
    if (streakEl) streakEl.textContent = `${streak} 🔥`;

    const masteredEl = this.element.querySelector('#dash-mastered');
    if (masteredEl) masteredEl.textContent = `${masteredCount} / ${totalWords} (${pct}%)`;

    const progressFill = this.element.querySelector('#dash-progress-fill');
    if (progressFill) progressFill.style.width = `${pct}%`;

    if (this.dailyWord) {
      const isMastered = storage.isWordMastered(this.dailyWord.japanese);
      const cardTitle = this.element.querySelector('#daily-word-title');
      const cardSub = this.element.querySelector('#daily-word-sub');
      const cardMeaning = this.element.querySelector('#daily-word-meaning');
      const cardTopic = this.element.querySelector('#daily-word-topic');
      const masterBtn = this.element.querySelector('#daily-master-btn');

      if (cardTitle) cardTitle.textContent = this.dailyWord.japanese;
      if (cardSub) cardSub.textContent = this.dailyWord.romaji;
      if (cardMeaning) cardMeaning.textContent = this.dailyWord.english;
      if (cardTopic) cardTopic.textContent = `${this.dailyWord.topic_ja} · ${this.dailyWord.subtopic_ja}`;
      if (masterBtn) {
        masterBtn.textContent = isMastered ? '✓ Mastered' : 'Mark as Mastered';
        masterBtn.className = isMastered ? 'btn btn--sm btn--primary' : 'btn btn--sm btn--secondary';
      }
    }
  }

  render() {
    return `
      <div class="page-header">
        <h1>日本語 Learning Hub</h1>
        <p>Master Japanese vocabulary with interactive flashcards, quizzes, and mini-games.</p>
      </div>

      <div class="dash-summary-grid">
        <div class="stat-card">
          <div class="stat-card__icon">🔥</div>
          <div class="stat-card__info">
            <span class="stat-card__label">Daily Streak</span>
            <span class="stat-card__value" id="dash-streak">0 🔥</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon">📚</div>
          <div class="stat-card__info">
            <span class="stat-card__label">Mastered Words</span>
            <span class="stat-card__value" id="dash-mastered">0 / 0 (0%)</span>
          </div>
        </div>
      </div>

      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span class="card__meta">Overall Progress</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="dash-progress-fill" style="width: 0%"></div>
        </div>
      </div>

      <!-- Word of the Day -->
      <div class="content-block daily-word-block">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2>Word of the Day</h2>
          <span class="badge" id="daily-word-topic">...</span>
        </div>
        <div class="daily-word-display">
          <div>
            <h1 id="daily-word-title" style="font-size:2.2rem; color:var(--primary);">...</h1>
            <p id="daily-word-sub" style="font-weight:600; color:var(--text-muted);">...</p>
            <p id="daily-word-meaning" style="font-size:1.1rem; margin-top:0.4rem;">...</p>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
            <button type="button" class="btn btn--secondary btn--sm" data-action="play-daily-audio" title="Listen Audio">
              🔊 Listen
            </button>
            <button type="button" id="daily-master-btn" class="btn btn--sm btn--secondary" data-action="toggle-daily-mastered">
              Mark as Mastered
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Nav Launchers -->
      <h2 style="margin: 1.5rem 0 1rem 0;">Learning Modes</h2>
      <div class="card-grid">
        <article class="card interactive-card" data-go="1">
          <div class="card__icon">🎴</div>
          <h3>Flashcards</h3>
          <p>Review vocabulary with flip cards, furigana toggles, and audio hints.</p>
          <button type="button" class="btn btn--secondary btn--sm">Start Flashcards</button>
        </article>

        <article class="card interactive-card" data-go="2">
          <div class="card__icon">📝</div>
          <h3>Quiz & Tests</h3>
          <p>Test your knowledge with multiple choice, listening, and translation quizzes.</p>
          <button type="button" class="btn btn--secondary btn--sm">Take Quiz</button>
        </article>

        <article class="card interactive-card" data-go="3">
          <div class="card__icon">🎮</div>
          <h3>Minigames</h3>
          <p>Play Kana Crosswords, Memory Match, and Word Unscramble games.</p>
          <button type="button" class="btn btn--secondary btn--sm">Play Games</button>
        </article>

        <article class="card interactive-card" data-go="4">
          <div class="card__icon">あ</div>
          <h3>Kana Chart</h3>
          <p>Full reference table for Hiragana and Katakana characters with audio.</p>
          <button type="button" class="btn btn--secondary btn--sm">View Kana</button>
        </article>
      </div>

      <footer class="module-footer">
        日本語 Learning Application · Version 2.0
      </footer>
    `;
  }
}
