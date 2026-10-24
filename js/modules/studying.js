/**
 * Studying Module — Main section for teaching Japanese vocabulary organized by Theme & Subtopic.
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';

export class StudyingModule extends Module {
  constructor() {
    super({
      id: 5,
      name: 'Studying',
      navLabel: '学習 (Study)',
      navOrder: 1
    });

    this.selectedTopicId = null;
    this.selectedSubtopicId = null;
  }

  show() {
    super.show();
    this.renderStudyContent();
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      // Theme card click
      const themeCard = e.target.closest('[data-select-theme]');
      if (themeCard) {
        this.selectedTopicId = themeCard.getAttribute('data-select-theme');
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      // Subtopic tab / card click
      const subCard = e.target.closest('[data-select-subtopic]');
      if (subCard) {
        this.selectedSubtopicId = subCard.getAttribute('data-select-subtopic');
        this.renderStudyContent();
        return;
      }

      // Back to Themes button
      const backThemesBtn = e.target.closest('[data-action="back-to-themes"]');
      if (backThemesBtn) {
        this.selectedTopicId = null;
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      // Audio button click
      const audioBtn = e.target.closest('[data-play-audio]');
      if (audioBtn) {
        const wordText = audioBtn.getAttribute('data-play-audio');
        if (wordText) audioPlayer.play(wordText);
        return;
      }

      // Toggle Mastered button click
      const masterBtn = e.target.closest('[data-toggle-mastered]');
      if (masterBtn) {
        const wordJp = masterBtn.getAttribute('data-toggle-mastered');
        if (wordJp) {
          storage.toggleWordMastered(wordJp);
          this.renderStudyContent();
        }
        return;
      }

      // Toggle Review button click
      const reviewBtn = e.target.closest('[data-toggle-review]');
      if (reviewBtn) {
        const wordJp = reviewBtn.getAttribute('data-toggle-review');
        if (wordJp) {
          storage.toggleNeedsReview(wordJp);
          this.renderStudyContent();
        }
        return;
      }
    });
  }

  renderStudyContent() {
    if (!this.element) return;
    const root = this.element.querySelector('#studying-root');
    if (!root) return;

    const allDatasets = dataManager.getAllDatasets();
    const activeDatasetIds = storage.settings.activeDatasetIds || ['marugoto_a1'];
    const activeDatasets = allDatasets.filter((ds) => activeDatasetIds.includes(ds.id));

    // Gather all topics from active datasets
    const topics = [];
    activeDatasets.forEach((ds) => {
      ds.topics.forEach((t, idx) => {
        topics.push({
          ...t,
          datasetId: ds.id,
          themeNumber: idx + 1
        });
      });
    });

    if (topics.length === 0) {
      root.innerHTML = `
        <div class="content-block text-center" style="padding: 3rem 1rem;">
          <h3>No active themes found!</h3>
          <p>Please check your active dataset settings in Settings.</p>
        </div>
      `;
      return;
    }

    // LEVEL 1: TOPIC / THEME SELECTION MENU
    if (!this.selectedTopicId) {
      root.innerHTML = `
        <div class="page-header">
          <h2>Japanese Study Themes</h2>
          <p>Select a Theme to start learning vocabulary, readings, and meanings.</p>
        </div>

        <div class="card-grid">
          ${topics
            .map((t) => {
              const totalWords = t.subtopics.reduce((acc, sub) => acc + sub.words.length, 0);
              const masteredCount = t.subtopics.reduce((acc, sub) => {
                return acc + sub.words.filter((w) => storage.isWordMastered(w.japanese)).length;
              }, 0);
              const pct = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

              return `
                <article class="card interactive-card" data-select-theme="${t.topic_id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge">Theme ${t.themeNumber}</span>
                    <span class="text-muted" style="font-size:0.85rem;">${pct}%</span>
                  </div>
                  <h3>${t.topic_ja}</h3>
                  <p style="font-size:0.95rem; font-weight:600; color:var(--text); margin-bottom:0.25rem;">${t.topic_en}</p>
                  <p class="text-muted" style="font-size:0.85rem; margin-bottom:1rem;">Subtopics: ${t.subtopics.length} · Words: ${totalWords}</p>

                  <div class="progress-bar-container" style="height:6px; margin-bottom:0.75rem;">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                  </div>
                  <button type="button" class="btn btn--secondary btn--sm" style="width:100%;">Explore Theme ➔</button>
                </article>
              `;
            })
            .join('')}
        </div>
      `;
      return;
    }

    // LEVEL 2: DETAILED THEME VIEW (Theme X > Subtopic 1 / Subtopic 2 ...)
    const currentTopic = topics.find((t) => t.topic_id === this.selectedTopicId) || topics[0];
    if (!currentTopic) {
      this.selectedTopicId = null;
      this.renderStudyContent();
      return;
    }

    // Select first subtopic if none selected
    if (!this.selectedSubtopicId && currentTopic.subtopics.length > 0) {
      this.selectedSubtopicId = currentTopic.subtopics[0].subtopic_id;
    }

    const currentSubtopic = currentTopic.subtopics.find((s) => s.subtopic_id === this.selectedSubtopicId) || currentTopic.subtopics[0];

    root.innerHTML = `
      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-themes">⬅️ Back to Themes</button>
          <span class="badge">Theme ${currentTopic.themeNumber}: ${currentTopic.topic_ja} (${currentTopic.topic_en})</span>
        </div>

        <!-- Subtopics Selector Tabs -->
        <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.5rem; border-bottom:1px solid var(--border); margin-bottom:1.5rem;">
          ${currentTopic.subtopics
            .map((sub, idx) => {
              const isSel = sub.subtopic_id === currentSubtopic.subtopic_id;
              return `
                <button type="button" class="btn ${isSel ? 'btn--primary' : 'btn--secondary'} btn--sm" data-select-subtopic="${sub.subtopic_id}" style="white-space:nowrap;">
                  Subtopic ${idx + 1}: ${sub.subtopic_ja}
                </button>
              `;
            })
            .join('')}
        </div>

        <!-- Subtopic Header -->
        <div style="margin-bottom:1.5rem;">
          <h2 style="font-size:1.5rem; color:var(--primary); margin-bottom:0.25rem;">
            ${currentSubtopic.subtopic_ja} (${currentSubtopic.subtopic_en})
          </h2>
          <p class="text-muted">Master Japanese words for this lesson below.</p>
        </div>

        <!-- Words List Cards -->
        <div class="study-words-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
          ${currentSubtopic.words
            .map((w) => {
              const isMastered = storage.isWordMastered(w.japanese);
              const isNeedsReview = storage.isNeedsReview(w.japanese);
              const rubyHtml = DataManager.formatJapaneseDisplay(w.japanese, 'ruby');

              return `
                <div class="card" style="padding:1.25rem; position:relative; border-top:3px solid ${isMastered ? 'var(--success)' : isNeedsReview ? 'var(--danger)' : 'var(--primary)'};">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                      <div style="font-size:1.8rem; font-weight:800; color:var(--text);">${rubyHtml}</div>
                      <div style="font-size:0.95rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;">${w.romaji}</div>
                    </div>
                    <button type="button" class="btn-icon" data-play-audio="${w.japanese}" title="Listen Audio">🔊</button>
                  </div>

                  <div style="font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:1rem;">
                    ${w.english}
                  </div>

                  <div style="display:flex; gap:0.5rem; margin-top:auto;">
                    <button type="button" class="btn btn--sm ${isNeedsReview ? 'btn--danger' : 'btn--ghost'}" data-toggle-review="${w.japanese}" style="flex:1;">
                      ${isNeedsReview ? '⚠️ Review' : 'Mark Review'}
                    </button>
                    <button type="button" class="btn btn--sm ${isMastered ? 'btn--primary' : 'btn--secondary'}" data-toggle-mastered="${w.japanese}" style="flex:1;">
                      ${isMastered ? '✓ Mastered' : 'Master'}
                    </button>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  render() {
    return `
      <div class="page-header">
        <h1>Studying (日本語学習)</h1>
        <p>Explore themes and subtopics to learn Japanese vocabulary with audio & furigana.</p>
      </div>

      <div id="studying-root">
        <!-- Rendered dynamically -->
      </div>

      <footer class="module-footer">
        Module 5 · Studying
      </footer>
    `;
  }
}
