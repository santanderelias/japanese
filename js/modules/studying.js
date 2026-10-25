/**
 * Studying Module — Genki-style Japanese learning module.
 * Features structured lessons with Dialogue (会話), Vocabulary (単語), and Grammar (文法) breakdowns.
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
      navLabel: '学習',
      navOrder: 1
    });

    this.selectedLessonId = null;
    this.activeTab = 'dialogue'; // 'dialogue' | 'vocabulary' | 'grammar'
    this.showTranslations = true;
    this.viewMode = 'genki'; // 'genki' | 'marugoto'

    // Marugoto fallback state
    this.selectedTopicId = null;
    this.selectedSubtopicId = null;
  }

  show() {
    super.show();
    this.renderStudyContent();
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      // Toggle curriculum view mode (Genki Lessons vs Marugoto Themes)
      const switchModeBtn = e.target.closest('[data-switch-mode]');
      if (switchModeBtn) {
        this.viewMode = switchModeBtn.getAttribute('data-switch-mode');
        this.selectedLessonId = null;
        this.selectedTopicId = null;
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      // Genki Lesson selection card click
      const lessonCard = e.target.closest('[data-select-lesson]');
      if (lessonCard) {
        this.selectedLessonId = lessonCard.getAttribute('data-select-lesson');
        this.activeTab = 'dialogue';
        this.renderStudyContent();
        return;
      }

      // Back to Lessons / Themes
      const backLessonsBtn = e.target.closest('[data-action="back-to-lessons"]');
      if (backLessonsBtn) {
        this.selectedLessonId = null;
        this.selectedTopicId = null;
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      // Lesson Tab switch (Dialogue, Vocabulary, Grammar)
      const tabBtn = e.target.closest('[data-select-tab]');
      if (tabBtn) {
        this.activeTab = tabBtn.getAttribute('data-select-tab');
        this.renderStudyContent();
        return;
      }

      // Toggle Translations in Dialogue
      const toggleTransBtn = e.target.closest('[data-action="toggle-translations"]');
      if (toggleTransBtn) {
        this.showTranslations = !this.showTranslations;
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

      // --- Marugoto View Handlers ---
      const themeCard = e.target.closest('[data-select-theme]');
      if (themeCard) {
        this.selectedTopicId = themeCard.getAttribute('data-select-theme');
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      const subCard = e.target.closest('[data-select-subtopic]');
      if (subCard) {
        this.selectedSubtopicId = subCard.getAttribute('data-select-subtopic');
        this.renderStudyContent();
        return;
      }
    });
  }

  renderStudyContent() {
    if (!this.element) return;
    const root = this.element.querySelector('#studying-root');
    if (!root) return;

    if (this.viewMode === 'genki') {
      this.renderGenkiView(root);
    } else {
      this.renderMarugotoView(root);
    }
  }

  /**
   * Genki-Style Teaching View
   */
  renderGenkiView(root) {
    const lessons = dataManager.getGenkiLessons();

    // LEVEL 1: LESSON SELECTION MENU
    if (!this.selectedLessonId) {
      root.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
          <div>
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;">Genki Japanese Lessons (初級日本語)</h2>
            <p class="text-muted" style="margin:0;">Master Japanese grammar, dialogues, and vocabulary step-by-step.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button type="button" class="btn btn--primary btn--sm" data-switch-mode="genki">📘 Genki Lessons</button>
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="marugoto">📚 Marugoto Themes</button>
          </div>
        </div>

        <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
          ${lessons
            .map((l) => {
              const totalVocab = l.vocabulary ? l.vocabulary.length : 0;
              const masteredVocab = l.vocabulary
                ? l.vocabulary.filter((v) => storage.isWordMastered(v.japanese)).length
                : 0;
              const pct = totalVocab > 0 ? Math.round((masteredVocab / totalVocab) * 100) : 0;
              const rubyTitle = DataManager.formatJapaneseDisplay(l.title_ja, 'ruby');

              return `
                <article class="card interactive-card" data-select-lesson="${l.id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge">Lesson ${l.lesson_number}</span>
                    <span class="text-muted" style="font-size:0.85rem; font-weight:700;">${pct}% Mastered</span>
                  </div>
                  <h3 style="font-size:1.25rem; font-weight:800; color:var(--text); margin-bottom:0.15rem;">${rubyTitle}</h3>
                  <p style="font-size:0.95rem; font-weight:700; color:var(--primary); margin-bottom:0.5rem;">${l.title_en}</p>
                  <p class="text-muted" style="font-size:0.85rem; margin-bottom:1rem; min-height:2.6em; line-height:1.35;">${l.description}</p>

                  <div style="display:flex; gap:0.5rem; font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:0.75rem;">
                    <span>💬 Dialogue</span> ·
                    <span>📖 ${totalVocab} Words</span> ·
                    <span>📝 ${l.grammar ? l.grammar.length : 0} Grammar Points</span>
                  </div>

                  <div class="progress-bar-container" style="height:6px; margin-bottom:0.75rem;">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                  </div>
                  <button type="button" class="btn btn--secondary btn--sm" style="width:100%;">Start Lesson ➔</button>
                </article>
              `;
            })
            .join('')}
        </div>
      `;
      return;
    }

    // LEVEL 2: LESSON DETAILED VIEW (Dialogue / Vocabulary / Grammar)
    const currentLesson = dataManager.getGenkiLessonById(this.selectedLessonId) || lessons[0];
    if (!currentLesson) {
      this.selectedLessonId = null;
      this.renderStudyContent();
      return;
    }

    const rubyLessonTitle = DataManager.formatJapaneseDisplay(currentLesson.title_ja, 'ruby');

    root.innerHTML = `
      <div class="content-block">
        <!-- Top Bar Navigation -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-lessons">⬅️ Back to Lessons</button>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge">Lesson ${currentLesson.lesson_number}</span>
            <span style="font-weight:700; color:var(--text);">${currentLesson.title_en}</span>
          </div>
        </div>

        <!-- Lesson Header Title -->
        <div style="margin-bottom:1.5rem;">
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--primary); margin-bottom:0.25rem;">
            ${rubyLessonTitle} (${currentLesson.title_en})
          </h2>
          <p class="text-muted" style="font-size:0.925rem;">${currentLesson.description}</p>
        </div>

        <!-- Section Navigation Tabs -->
        <div style="display:flex; gap:0.5rem; border-bottom:2px solid var(--border); margin-bottom:1.5rem; padding-bottom:0.5rem;">
          <button type="button" class="btn ${this.activeTab === 'dialogue' ? 'btn--primary' : 'btn--ghost'} btn--sm" data-select-tab="dialogue">
            💬 Dialogue (会話)
          </button>
          <button type="button" class="btn ${this.activeTab === 'vocabulary' ? 'btn--primary' : 'btn--ghost'} btn--sm" data-select-tab="vocabulary">
            📖 Vocabulary (${currentLesson.vocabulary ? currentLesson.vocabulary.length : 0})
          </button>
          <button type="button" class="btn ${this.activeTab === 'grammar' ? 'btn--primary' : 'btn--ghost'} btn--sm" data-select-tab="grammar">
            📝 Grammar (${currentLesson.grammar ? currentLesson.grammar.length : 0})
          </button>
        </div>

        <!-- Tab Body Container -->
        <div id="genki-tab-content">
          ${
            this.activeTab === 'dialogue'
              ? this.renderDialogueTab(currentLesson)
              : this.activeTab === 'vocabulary'
              ? this.renderVocabularyTab(currentLesson)
              : this.renderGrammarTab(currentLesson)
          }
        </div>
      </div>
    `;
  }

  /**
   * Render Dialogue (会話) Section
   */
  renderDialogueTab(lesson) {
    const diag = lesson.dialogue;
    if (!diag) {
      return `<p class="text-muted">No dialogue available for this lesson.</p>`;
    }

    const rubyDiagTitle = DataManager.formatJapaneseDisplay(diag.title_ja, 'ruby');

    return `
      <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
        <div>
          <h3 style="font-size:1.2rem; font-weight:800; color:var(--text);">${rubyDiagTitle}</h3>
          <span class="text-muted" style="font-size:0.9rem;">${diag.title_en}</span>
        </div>
        <button type="button" class="btn btn--secondary btn--sm" data-action="toggle-translations">
          ${this.showTranslations ? '👁️ Hide English Translations' : '👁️ Show English Translations'}
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:0.85rem; margin-top:1rem;">
        ${diag.lines
          .map((line) => {
            const lineRuby = DataManager.formatJapaneseDisplay(line.japanese, 'ruby');
            return `
              <div class="card" style="padding:1rem; background:var(--bg-elevated); border-left:4px solid var(--primary); border-radius:var(--radius-sm);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.35rem;">
                  <span class="badge" style="background:var(--primary-soft); color:var(--primary); font-size:0.8rem;">
                    ${line.speaker}
                  </span>
                  <button type="button" class="btn-icon" data-play-audio="${line.japanese}" title="Listen to line">🔊</button>
                </div>

                <div style="font-size:1.25rem; font-weight:700; color:var(--text); margin-bottom:0.25rem;">
                  ${lineRuby}
                </div>
                <div style="font-size:0.85rem; font-weight:600; color:var(--text-muted); margin-bottom:0.25rem;">
                  ${line.romaji}
                </div>

                ${
                  this.showTranslations
                    ? `<div style="font-size:0.95rem; font-weight:600; color:var(--accent); margin-top:0.35rem; padding-top:0.35rem; border-top:1px dashed var(--border);">
                        ${line.english}
                       </div>`
                    : ''
                }
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /**
   * Render Vocabulary (単語) Section
   */
  renderVocabularyTab(lesson) {
    const vocab = lesson.vocabulary || [];
    if (vocab.length === 0) {
      return `<p class="text-muted">No vocabulary items listed for this lesson.</p>`;
    }

    return `
      <div style="margin-bottom:1rem;">
        <p class="text-muted" style="font-size:0.9rem;">
          Click audio icons to listen to pronunciation. Mark items as Mastered or Needs Review to track your progress!
        </p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
        ${vocab
          .map((w) => {
            const isMastered = storage.isWordMastered(w.japanese);
            const isNeedsReview = storage.isNeedsReview(w.japanese);
            const rubyHtml = DataManager.formatJapaneseDisplay(w.japanese, 'ruby');

            return `
              <div class="card" style="padding:1.15rem; position:relative; border-top:3px solid ${
                isMastered ? 'var(--success)' : isNeedsReview ? 'var(--danger)' : 'var(--primary)'
              };">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                  <div>
                    <div style="font-size:1.6rem; font-weight:800; color:var(--text);">${rubyHtml}</div>
                    <div style="font-size:0.9rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;">${w.romaji}</div>
                  </div>
                  <button type="button" class="btn-icon" data-play-audio="${w.japanese}" title="Listen Audio">🔊</button>
                </div>

                <div style="font-size:1.05rem; font-weight:700; color:var(--primary); margin-bottom:1rem;">
                  ${w.english}
                </div>

                <div style="display:flex; gap:0.5rem; margin-top:auto;">
                  <button type="button" class="btn btn--sm ${
                    isNeedsReview ? 'btn--danger' : 'btn--ghost'
                  }" data-toggle-review="${w.japanese}" style="flex:1;">
                    ${isNeedsReview ? '⚠️ Review' : 'Mark Review'}
                  </button>
                  <button type="button" class="btn btn--sm ${
                    isMastered ? 'btn--primary' : 'btn--secondary'
                  }" data-toggle-mastered="${w.japanese}" style="flex:1;">
                    ${isMastered ? '✓ Mastered' : 'Master'}
                  </button>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /**
   * Render Grammar (文法) Section
   */
  renderGrammarTab(lesson) {
    const grammarList = lesson.grammar || [];
    if (grammarList.length === 0) {
      return `<p class="text-muted">No grammar explanations listed for this lesson.</p>`;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        ${grammarList
          .map((g, idx) => {
            return `
              <article class="card" style="padding:1.25rem; border-left:4px solid var(--accent);">
                <h3 style="font-size:1.2rem; font-weight:800; color:var(--primary); margin-bottom:0.75rem;">
                  ${g.title}
                </h3>

                <p style="font-size:0.95rem; line-height:1.6; color:var(--text); margin-bottom:1rem; white-space:pre-line;">
                  ${g.explanation}
                </p>

                ${
                  g.structure
                    ? `<div style="background:var(--bg-muted); border-radius:var(--radius-sm); padding:0.75rem 1rem; font-family:monospace; font-weight:700; font-size:0.9rem; color:var(--primary); margin-bottom:1rem;">
                        💡 Sentence Pattern: ${g.structure}
                       </div>`
                    : ''
                }

                ${
                  g.examples && g.examples.length > 0
                    ? `<div style="margin-top:1rem;">
                        <h4 style="font-size:0.9rem; font-weight:700; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.5rem;">Example Sentences:</h4>
                        <div style="display:flex; flex-direction:column; gap:0.65rem;">
                          ${g.examples
                            .map((ex) => {
                              const exRuby = DataManager.formatJapaneseDisplay(ex.japanese, 'ruby');
                              return `
                                <div style="background:var(--bg); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border);">
                                  <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span style="font-size:1.1rem; font-weight:700; color:var(--text);">${exRuby}</span>
                                    <button type="button" class="btn-icon" data-play-audio="${ex.japanese}" style="width:30px; height:30px; font-size:0.85rem;" title="Listen">🔊</button>
                                  </div>
                                  <div style="font-size:0.825rem; font-weight:600; color:var(--text-muted);">${ex.romaji}</div>
                                  <div style="font-size:0.9rem; font-weight:600; color:var(--accent); margin-top:0.25rem;">${ex.english}</div>
                                </div>
                              `;
                            })
                            .join('')}
                        </div>
                      </div>`
                    : ''
                }
              </article>
            `;
          })
          .join('')}
      </div>
    `;
  }

  /**
   * Marugoto Wordbook View (Fallback / Alternative)
   */
  renderMarugotoView(root) {
    const allDatasets = dataManager.getAllDatasets();
    const activeDatasetIds = storage.settings.activeDatasetIds || ['marugoto_a1'];
    const activeDatasets = allDatasets.filter((ds) => activeDatasetIds.includes(ds.id));

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

    if (!this.selectedTopicId) {
      root.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
          <div>
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;">Marugoto Wordbook Themes</h2>
            <p class="text-muted" style="margin:0;">Browse Japanese vocabulary organized by themes and subtopics.</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="genki">📘 Genki Lessons</button>
            <button type="button" class="btn btn--primary btn--sm" data-switch-mode="marugoto">📚 Marugoto Themes</button>
          </div>
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

    const currentTopic = topics.find((t) => t.topic_id === this.selectedTopicId) || topics[0];
    if (!this.selectedSubtopicId && currentTopic.subtopics.length > 0) {
      this.selectedSubtopicId = currentTopic.subtopics[0].subtopic_id;
    }
    const currentSubtopic =
      currentTopic.subtopics.find((s) => s.subtopic_id === this.selectedSubtopicId) || currentTopic.subtopics[0];

    root.innerHTML = `
      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-lessons">⬅️ Back to Themes</button>
          <span class="badge">Theme ${currentTopic.themeNumber}: ${currentTopic.topic_ja} (${currentTopic.topic_en})</span>
        </div>

        <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.5rem; border-bottom:1px solid var(--border); margin-bottom:1.5rem;">
          ${currentTopic.subtopics
            .map((sub, idx) => {
              const isSel = sub.subtopic_id === currentSubtopic.subtopic_id;
              return `
                <button type="button" class="btn ${
                  isSel ? 'btn--primary' : 'btn--secondary'
                } btn--sm" data-select-subtopic="${sub.subtopic_id}" style="white-space:nowrap;">
                  Subtopic ${idx + 1}: ${sub.subtopic_ja}
                </button>
              `;
            })
            .join('')}
        </div>

        <div style="margin-bottom:1.5rem;">
          <h2 style="font-size:1.5rem; color:var(--primary); margin-bottom:0.25rem;">
            ${currentSubtopic.subtopic_ja} (${currentSubtopic.subtopic_en})
          </h2>
          <p class="text-muted">Master Japanese words for this lesson below.</p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:1rem;">
          ${currentSubtopic.words
            .map((w) => {
              const isMastered = storage.isWordMastered(w.japanese);
              const isNeedsReview = storage.isNeedsReview(w.japanese);
              const rubyHtml = DataManager.formatJapaneseDisplay(w.japanese, 'ruby');

              return `
                <div class="card" style="padding:1.15rem; position:relative; border-top:3px solid ${
                  isMastered ? 'var(--success)' : isNeedsReview ? 'var(--danger)' : 'var(--primary)'
                };">
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
                    <button type="button" class="btn btn--sm ${
                      isNeedsReview ? 'btn--danger' : 'btn--ghost'
                    }" data-toggle-review="${w.japanese}" style="flex:1;">
                      ${isNeedsReview ? '⚠️ Review' : 'Mark Review'}
                    </button>
                    <button type="button" class="btn btn--sm ${
                      isMastered ? 'btn--primary' : 'btn--secondary'
                    }" data-toggle-mastered="${w.japanese}" style="flex:1;">
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
        <p>Interactive Genki Japanese lessons with dialogues, vocabulary, and grammar rules.</p>
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
