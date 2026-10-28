/**
 * Studying Module — Genki & Marugoto Textbook Japanese Learning Experience.
 * Features structured lessons with Page Navigation (Dialogue, Grammar & Particles, Vocabulary, Exercises),
 * particle breakdown references, and seamless links to Minigame practice sessions.
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';
import { orchestrator } from '../orchestrator.js';

export class StudyingModule extends Module {
  constructor() {
    super({
      id: 1,
      name: 'Studying',
      navLabel: '学習',
      navOrder: 1
    });

    this.selectedLessonId = null;
    this.currentPage = 1; // 1: Dialogue, 2: Grammar & Particles, 3: Vocabulary, 4: Exercises
    this.showTranslations = true;
    this.viewMode = 'genki'; // 'genki' | 'marugoto' | 'particles'

    // Marugoto state
    this.selectedTopicId = null;
    this.selectedSubtopicId = null;
  }

  show() {
    super.show();
    this.renderStudyContent();
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      // Switch view mode (Genki Lessons, Particles Guide, Marugoto Themes)
      const switchModeBtn = e.target.closest('[data-switch-mode]');
      if (switchModeBtn) {
        this.viewMode = switchModeBtn.getAttribute('data-switch-mode');
        this.selectedLessonId = null;
        this.selectedTopicId = null;
        this.selectedSubtopicId = null;
        this.currentPage = 1;
        this.renderStudyContent();
        return;
      }

      // Genki Lesson selection card click
      const lessonCard = e.target.closest('[data-select-lesson]');
      if (lessonCard) {
        this.selectedLessonId = lessonCard.getAttribute('data-select-lesson');
        this.currentPage = 1;
        this.renderStudyContent();
        return;
      }

      // Back to Lessons / Library
      const backLessonsBtn = e.target.closest('[data-action="back-to-lessons"]');
      if (backLessonsBtn) {
        this.selectedLessonId = null;
        this.selectedTopicId = null;
        this.selectedSubtopicId = null;
        this.renderStudyContent();
        return;
      }

      // Page pagination navigation
      const pageNavBtn = e.target.closest('[data-go-page]');
      if (pageNavBtn) {
        const targetPage = Number(pageNavBtn.getAttribute('data-go-page'));
        if (targetPage >= 1 && targetPage <= 4) {
          this.currentPage = targetPage;
          this.renderStudyContent();
          window.scrollTo(0, 0);
        }
        return;
      }

      // Toggle Translations in Dialogue
      const toggleTransBtn = e.target.closest('[data-action="toggle-translations"]');
      if (toggleTransBtn) {
        this.showTranslations = !this.showTranslations;
        this.renderStudyContent();
        return;
      }

      // Launch Exercise in Minigames module
      const launchExerciseBtn = e.target.closest('[data-launch-exercise]');
      if (launchExerciseBtn) {
        const gameType = launchExerciseBtn.getAttribute('data-launch-exercise');
        const lessonId = this.selectedLessonId;

        // Pass lesson context to MinigameModule if available
        const minigameMod = orchestrator.get(2);
        if (minigameMod && typeof minigameMod.startLessonExercise === 'function') {
          minigameMod.startLessonExercise(gameType, lessonId);
        } else {
          orchestrator.show(2);
        }
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
    } else if (this.viewMode === 'particles') {
      this.renderParticlesReferenceView(root);
    } else {
      this.renderMarugotoView(root);
    }
  }

  /**
   * Genki-Style Textbook View
   */
  renderGenkiView(root) {
    const lessons = dataManager.getGenkiLessons();

    // MENU 1: LESSON SELECTION MENU
    if (!this.selectedLessonId) {
      root.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
          <div>
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;">Genki Japanese Library (初級日本語)</h2>
            <p class="text-muted" style="margin:0;">Interactive textbook with dialogues, particle guides, grammar patterns, and exercises.</p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn--primary btn--sm" data-switch-mode="genki">📘 Genki Lessons</button>
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="particles">⚡ Particles Guide</button>
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="marugoto">📚 Marugoto Wordbook</button>
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
              const particles = l.particles || [];

              return `
                <article class="card interactive-card" data-select-lesson="${l.id}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge">Lesson ${l.lesson_number}</span>
                    <span class="text-muted" style="font-size:0.85rem; font-weight:700;">${pct}% Mastered</span>
                  </div>
                  <h3 style="font-size:1.25rem; font-weight:800; color:var(--text); margin-bottom:0.15rem;">${rubyTitle}</h3>
                  <p style="font-size:0.95rem; font-weight:700; color:var(--primary); margin-bottom:0.5rem;">${l.title_en}</p>
                  <p class="text-muted" style="font-size:0.85rem; margin-bottom:0.75rem; min-height:2.6em; line-height:1.35;">${l.description}</p>

                  ${
                    particles.length > 0
                      ? `<div style="display:flex; align-items:center; gap:0.35rem; margin-bottom:0.75rem; flex-wrap:wrap;">
                          <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Particles:</span>
                          ${particles
                            .map(
                              (p) =>
                                `<span class="badge" style="background:var(--primary-soft); color:var(--primary); font-size:0.75rem; padding:0.15rem 0.45rem;">${p}</span>`
                            )
                            .join('')}
                         </div>`
                      : ''
                  }

                  <div style="display:flex; gap:0.5rem; font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-bottom:0.75rem;">
                    <span>📖 4 Textbook Pages</span> ·
                    <span>📝 ${l.grammar ? l.grammar.length : 0} Grammar Points</span>
                  </div>

                  <div class="progress-bar-container" style="height:6px; margin-bottom:0.75rem;">
                    <div class="progress-bar-fill" style="width: ${pct}%"></div>
                  </div>
                  <button type="button" class="btn btn--secondary btn--sm" style="width:100%;">Open Lesson ➔</button>
                </article>
              `;
            })
            .join('')}
        </div>
      `;
      return;
    }

    // MENU 2: TEXTBOOK PAGES READER
    const currentLesson = dataManager.getGenkiLessonById(this.selectedLessonId) || lessons[0];
    if (!currentLesson) {
      this.selectedLessonId = null;
      this.renderStudyContent();
      return;
    }

    const rubyLessonTitle = DataManager.formatJapaneseDisplay(currentLesson.title_ja, 'ruby');
    const pages = [
      { id: 1, name: 'Page 1: Dialogue (会話)' },
      { id: 2, name: 'Page 2: Grammar & Particles (文法)' },
      { id: 3, name: 'Page 3: Vocabulary (単語)' },
      { id: 4, name: 'Page 4: Practice Exercises (練習)' }
    ];

    root.innerHTML = `
      <div class="content-block">
        <!-- Top Navigation -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
          <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-lessons">⬅️ Back to Genki Library</button>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span class="badge">Lesson ${currentLesson.lesson_number}</span>
            <span style="font-weight:700; color:var(--text);">${currentLesson.title_en}</span>
          </div>
        </div>

        <!-- Lesson Header Title -->
        <div style="margin-bottom:1.25rem;">
          <h2 style="font-size:1.6rem; font-weight:800; color:var(--primary); margin-bottom:0.25rem;">
            ${rubyLessonTitle} (${currentLesson.title_en})
          </h2>
          <p class="text-muted" style="font-size:0.925rem; margin-bottom:0.5rem;">${currentLesson.description}</p>

          ${
            currentLesson.particles
              ? `<div style="display:flex; align-items:center; gap:0.4rem; font-size:0.85rem;">
                  <span style="font-weight:700; color:var(--text-muted);">Target Particles in Lesson:</span>
                  ${currentLesson.particles
                    .map(
                      (pt) => `<span class="badge" style="background:var(--accent); color:#fff; font-weight:800;">${pt}</span>`
                    )
                    .join('')}
                 </div>`
              : ''
          }
        </div>

        <!-- Page Tabs Navigation -->
        <div style="display:flex; gap:0.35rem; overflow-x:auto; border-bottom:2px solid var(--border); margin-bottom:1.25rem; padding-bottom:0.5rem;">
          ${pages
            .map(
              (pg) => `
            <button type="button" class="btn ${
              this.currentPage === pg.id ? 'btn--primary' : 'btn--ghost'
            } btn--sm" data-go-page="${pg.id}" style="white-space:nowrap;">
              ${pg.name}
            </button>
          `
            )
            .join('')}
        </div>

        <!-- Page Content View -->
        <div id="genki-page-content" style="min-height:300px;">
          ${
            this.currentPage === 1
              ? this.renderDialogueTab(currentLesson)
              : this.currentPage === 2
              ? this.renderGrammarTab(currentLesson)
              : this.currentPage === 3
              ? this.renderVocabularyTab(currentLesson)
              : this.renderExercisesTab(currentLesson)
          }
        </div>

        <!-- Bottom Page Pagination Controls -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem; padding-top:1rem; border-top:1px solid var(--border); flex-wrap:wrap; gap:0.5rem;">
          <button type="button" class="btn btn--secondary btn--sm" data-go-page="${this.currentPage - 1}" ${
      this.currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''
    }>
            ⬅️ Previous Page
          </button>

          <span class="text-muted" style="font-weight:700; font-size:0.875rem;">
            Page ${this.currentPage} of 4
          </span>

          <button type="button" class="btn btn--primary btn--sm" data-go-page="${this.currentPage + 1}" ${
      this.currentPage >= 4 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''
    }>
            Next Page ➡️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Page 1: Dialogue (会話)
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
   * Page 2: Grammar & Particles (文法)
   */
  renderGrammarTab(lesson) {
    const grammarList = lesson.grammar || [];
    if (grammarList.length === 0) {
      return `<p class="text-muted">No grammar explanations listed for this lesson.</p>`;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        ${grammarList
          .map((g) => {
            return `
              <article class="card" style="padding:1.25rem; border-left:4px solid var(--accent);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                  <h3 style="font-size:1.2rem; font-weight:800; color:var(--primary); margin:0;">
                    ${g.title}
                  </h3>
                  ${
                    g.particle
                      ? `<span class="badge" style="background:var(--accent); color:#fff; font-size:0.85rem; font-weight:800;">
                          Particle: ${g.particle}
                         </span>`
                      : ''
                  }
                </div>

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
   * Page 3: Vocabulary (単語)
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
   * Page 4: Exercises & Practice (練習問題)
   */
  renderExercisesTab(lesson) {
    const vocabCount = lesson.vocabulary ? lesson.vocabulary.length : 0;
    const grammarCount = lesson.grammar ? lesson.grammar.length : 0;

    return `
      <div style="max-width:700px; margin:0 auto;">
        <div style="text-align:center; margin-bottom:1.5rem;">
          <h3 style="font-size:1.4rem; font-weight:800; color:var(--primary); margin-bottom:0.25rem;">
            Lesson ${lesson.lesson_number} Practice Exercises
          </h3>
          <p class="text-muted" style="margin:0;">
            Test what you have learned from this page's Dialogue, Grammar, and ${vocabCount} Vocabulary Words!
          </p>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div class="card" style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--primary);">
            <div>
              <div style="font-size:1.5rem; margin-bottom:0.5rem;">🎴</div>
              <h4 style="font-size:1.1rem; font-weight:800; margin-bottom:0.35rem;">Lesson Flipcards</h4>
              <p class="text-muted" style="font-size:0.875rem; margin-bottom:1rem;">
                Review all ${vocabCount} words for Lesson ${lesson.lesson_number} with audio and interactive flips.
              </p>
            </div>
            <button type="button" class="btn btn--primary" data-launch-exercise="flashcards">
              Play Lesson Flipcards ➔
            </button>
          </div>

          <div class="card" style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--accent);">
            <div>
              <div style="font-size:1.5rem; margin-bottom:0.5rem;">📝</div>
              <h4 style="font-size:1.1rem; font-weight:800; margin-bottom:0.35rem;">Multiple Choice Quiz</h4>
              <p class="text-muted" style="font-size:0.875rem; margin-bottom:1rem;">
                Test your reading & listening skills on the ${grammarCount} grammar rules and vocabulary.
              </p>
            </div>
            <button type="button" class="btn btn--primary" data-launch-exercise="quiz">
              Start Lesson Quiz ➔
            </button>
          </div>

          <div class="card" style="padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; border-left:4px solid var(--success);">
            <div>
              <div style="font-size:1.5rem; margin-bottom:0.5rem;">🧩</div>
              <h4 style="font-size:1.1rem; font-weight:800; margin-bottom:0.35rem;">Word Unscramble</h4>
              <p class="text-muted" style="font-size:0.875rem; margin-bottom:1rem;">
                Arrange Kana tiles in correct order to spell target lesson vocabulary.
              </p>
            </div>
            <button type="button" class="btn btn--secondary" data-launch-exercise="unscramble">
              Play Unscramble ➔
            </button>
          </div>
        </div>

        <div style="background:var(--bg-muted); border-radius:var(--radius); padding:1rem; border:1px solid var(--border);">
          <h4 style="font-size:0.95rem; font-weight:700; color:var(--text); margin-bottom:0.25rem;">
            💡 Study Advice
          </h4>
          <p class="text-muted" style="font-size:0.85rem; margin:0;">
            When you complete an exercise in Minigames, click "Return to Lesson ${lesson.lesson_number}" to continue your study flow without losing your place!
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Dedicated Particle Reference Library View
   */
  renderParticlesReferenceView(root) {
    const particleList = [
      {
        symbol: 'は (wa)',
        role: 'Topic Marker',
        explanation: 'Marks the topic of a sentence ("as for X..."). Written as ha (は) but pronounced wa.',
        example_ja: '私(わたし)は 学生(がくせい)です。',
        example_en: 'I am a student.'
      },
      {
        symbol: 'か (ka)',
        role: 'Question Particle',
        explanation: 'Turns any statement into a question when placed at the sentence end.',
        example_ja: '留学生(りゅうがくせい)ですか。',
        example_en: 'Are you an international student?'
      },
      {
        symbol: 'の (no)',
        role: 'Possessive / Linking',
        explanation: 'Connects two nouns where Noun1 modifies or owns Noun2.',
        example_ja: '私(わたし)の 先生(せんせい)',
        example_en: 'My teacher'
      },
      {
        symbol: 'を (o)',
        role: 'Direct Object',
        explanation: 'Marks the object that directly receives the action of a verb.',
        example_ja: 'コーヒーを 飲(の)みます。',
        example_en: 'I drink coffee.'
      },
      {
        symbol: 'に (ni)',
        role: 'Target Time / Destination / Location of Existence',
        explanation: 'Marks exact times, movement destinations, or where something exists.',
        example_ja: '七時(しちじ)に 行(い)きます。',
        example_en: 'I will go at 7 o\'clock.'
      },
      {
        symbol: 'へ (e)',
        role: 'Direction of Movement',
        explanation: 'Emphasizes direction toward a destination. Written as he (へ) but pronounced e.',
        example_ja: 'うちへ 帰(かえ)ります。',
        example_en: 'I am heading home.'
      },
      {
        symbol: 'で (de)',
        role: 'Location of Action / Means & Transport',
        explanation: 'Marks the place where an action occurs, or the tool/transport used.',
        example_ja: 'カフェで コーヒーを 飲(の)みます。',
        example_en: 'I drink coffee at a cafe.'
      },
      {
        symbol: 'も (mo)',
        role: 'Inclusive ("Also / Too")',
        explanation: 'Replaces は or が to mean "also" or "too".',
        example_ja: 'メアリーさんも 学生(がくせい)です。',
        example_en: 'Mary is also a student.'
      },
      {
        symbol: 'が (ga)',
        role: 'Subject Marker',
        explanation: 'Marks the subject, especially with existence verbs あります and います.',
        example_ja: '猫(ねこ)が います。',
        example_en: 'There is a cat.'
      },
      {
        symbol: 'と (to)',
        role: 'Companion ("With") & Listing ("And")',
        explanation: 'Connects nouns ("and") or marks a companion ("with someone").',
        example_ja: '友達(ともだち)と 行(い)きました。',
        example_en: 'I went with a friend.'
      }
    ];

    root.innerHTML = `
      <div class="content-block">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
          <div>
            <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;">Japanese Particles Reference (助詞)</h2>
            <p class="text-muted" style="margin:0;">Essential Japanese particles learned throughout courses A1_1 and A1_2.</p>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="genki">📘 Genki Lessons</button>
            <button type="button" class="btn btn--primary btn--sm" data-switch-mode="particles">⚡ Particles Guide</button>
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="marugoto">📚 Marugoto Wordbook</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1rem;">
          ${particleList
            .map((p) => {
              const rubyEx = DataManager.formatJapaneseDisplay(p.example_ja, 'ruby');
              return `
                <article class="card" style="border-top:3px solid var(--accent); padding:1.15rem;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge" style="font-size:1rem; padding:0.2rem 0.6rem; background:var(--accent); color:#fff; font-weight:800;">
                      ${p.symbol}
                    </span>
                    <span style="font-size:0.8rem; font-weight:700; color:var(--text-muted);">${p.role}</span>
                  </div>

                  <p style="font-size:0.9rem; color:var(--text); margin-bottom:1rem; line-height:1.45;">
                    ${p.explanation}
                  </p>

                  <div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:0.65rem 0.85rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:1rem; font-weight:700; color:var(--text);">${rubyEx}</span>
                      <button type="button" class="btn-icon" data-play-audio="${p.example_ja}" style="width:28px; height:28px; font-size:0.8rem;" title="Listen">🔊</button>
                    </div>
                    <div style="font-size:0.825rem; font-weight:600; color:var(--accent); margin-top:0.25rem;">${p.example_en}</div>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Marugoto Wordbook View
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
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="genki">📘 Genki Lessons</button>
            <button type="button" class="btn btn--secondary btn--sm" data-switch-mode="particles">⚡ Particles Guide</button>
            <button type="button" class="btn btn--primary btn--sm" data-switch-mode="marugoto">📚 Marugoto Wordbook</button>
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
        <h1>日本語学習 (Study Library)</h1>
        <p>初級日本語教科書 — Genki-style dialogues, grammar rules, particle references, and practice exercises.</p>
      </div>

      <div id="studying-root">
        <!-- Rendered dynamically -->
      </div>

      <footer class="module-footer">
        Module 1 · Study
      </footer>
    `;
  }
}
