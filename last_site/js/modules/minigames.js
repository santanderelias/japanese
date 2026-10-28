/**
 * Minigames Module (2) — All interactive practice games in one section:
 * 1. Flipcards (Flashcards)
 * 2. Quiz & Tests
 * 3. Memory Pair Match
 * 4. Word Unscramble
 * 5. Kana Crossword
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';
import { showToast } from '../ui.js';
import { orchestrator } from '../orchestrator.js';

export class MinigameModule extends Module {
  constructor() {
    super({
      id: 2,
      name: 'Minigames',
      navLabel: 'ゲーム',
      navOrder: 2
    });

    this.currentGame = 'hub'; // 'hub', 'flashcards', 'quiz', 'memory', 'unscramble', 'crossword'
    this.activeLessonContext = null; // { lessonId, title, words } or null

    // Flashcards state
    this.flashcardWords = [];
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;

    // Quiz state
    this.quizMode = 'jp_to_en';
    this.quizCount = 10;
    this.quizQuestions = [];
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizActive = false;
    this.quizSelectedOpt = null;
    this.quizAnswered = false;

    // Memory Game state
    this.memoryCards = [];
    this.memoryFlipped = [];
    this.memoryMatched = [];
    this.memoryTimer = 0;
    this.memoryInterval = null;

    // Word Unscramble state
    this.unscrambleWords = [];
    this.unscrambleIndex = 0;
    this.unscrambleCurrentLetters = [];
    this.unscrambleUserLetters = [];

    // Crossword state
    this.crosswordLevelIndex = 0;
    this.crosswordGrid = [];
    this.crosswordUserGrid = [];
    this.crosswordHints = [];
    this.crosswordSelectedCell = null;
  }

  show() {
    super.show();
    this.renderGame();
  }

  /**
   * Start exercise pre-filtered for a specific Genki study lesson.
   */
  startLessonExercise(gameType, lessonId) {
    const lesson = dataManager.getGenkiLessonById(lessonId);
    let lessonWords = [];

    if (lesson && lesson.vocabulary && lesson.vocabulary.length > 0) {
      lessonWords = lesson.vocabulary.map((v) => ({
        japanese: v.japanese,
        romaji: v.romaji,
        english: v.english,
        topic_ja: lesson.title_ja,
        topic_en: lesson.title_en,
        subtopic_en: `Lesson ${lesson.lesson_number} Vocab`
      }));
    } else {
      lessonWords = dataManager.getWords();
    }

    this.activeLessonContext = {
      lessonId: lessonId || (lesson ? lesson.id : null),
      title: lesson ? `Lesson ${lesson.lesson_number}: ${lesson.title_en}` : 'Genki Lesson',
      words: lessonWords
    };

    this.currentGame = gameType;
    this.initGame(gameType, true);
    orchestrator.show(2);
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      // Return to Study Session
      const returnStudyBtn = e.target.closest('[data-action="return-to-study"]');
      if (returnStudyBtn) {
        this.stopMemoryTimer();
        this.currentGame = 'hub';
        orchestrator.show(1); // Show Studying Module (Module 1)
        return;
      }

      // Launch game
      const launchBtn = e.target.closest('[data-launch-game]');
      if (launchBtn) {
        const game = launchBtn.getAttribute('data-launch-game');
        this.activeLessonContext = null; // Clear context on manually launching from hub
        this.currentGame = game;
        this.initGame(game, false);
        return;
      }

      // Back to Games Hub
      const backBtn = e.target.closest('[data-action="back-to-hub"]');
      if (backBtn) {
        this.stopMemoryTimer();
        this.currentGame = 'hub';
        this.renderGame();
        return;
      }

      // --- FLASHCARDS ACTIONS ---
      if (this.currentGame === 'flashcards') {
        const flipBtn = e.target.closest('[data-action="fc-flip"]') || e.target.closest('.flashcard-inner');
        if (flipBtn && !e.target.closest('button')) {
          this.flashcardFlipped = !this.flashcardFlipped;
          this.renderGame();
          return;
        }

        const nextFc = e.target.closest('[data-action="fc-next"]');
        if (nextFc) {
          if (this.flashcardWords.length > 0) {
            this.flashcardFlipped = false;
            this.flashcardIndex = (this.flashcardIndex + 1) % this.flashcardWords.length;
            this.renderGame();
          }
          return;
        }

        const prevFc = e.target.closest('[data-action="fc-prev"]');
        if (prevFc) {
          if (this.flashcardWords.length > 0) {
            this.flashcardFlipped = false;
            this.flashcardIndex = (this.flashcardIndex - 1 + this.flashcardWords.length) % this.flashcardWords.length;
            this.renderGame();
          }
          return;
        }

        const fcAudio = e.target.closest('[data-action="fc-audio"]');
        if (fcAudio) {
          e.stopPropagation();
          const word = this.flashcardWords[this.flashcardIndex];
          if (word) audioPlayer.play(word.japanese);
          return;
        }

        const fcMaster = e.target.closest('[data-action="fc-master"]');
        if (fcMaster) {
          e.stopPropagation();
          const word = this.flashcardWords[this.flashcardIndex];
          if (word) {
            storage.toggleWordMastered(word.japanese);
            this.renderGame();
          }
          return;
        }

        const fcReview = e.target.closest('[data-action="fc-review"]');
        if (fcReview) {
          e.stopPropagation();
          const word = this.flashcardWords[this.flashcardIndex];
          if (word) {
            storage.toggleNeedsReview(word.japanese);
            this.renderGame();
          }
          return;
        }

        const fcShuffle = e.target.closest('[data-action="fc-shuffle"]');
        if (fcShuffle) {
          for (let i = this.flashcardWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.flashcardWords[i], this.flashcardWords[j]] = [this.flashcardWords[j], this.flashcardWords[i]];
          }
          this.flashcardIndex = 0;
          this.flashcardFlipped = false;
          this.renderGame();
          return;
        }
      }

      // --- QUIZ ACTIONS ---
      if (this.currentGame === 'quiz') {
        const startQuizBtn = e.target.closest('[data-action="start-quiz"]');
        if (startQuizBtn) {
          this.startQuiz();
          return;
        }

        const quizOpt = e.target.closest('[data-quiz-opt-idx]');
        if (quizOpt && this.quizActive && !this.quizAnswered) {
          const idx = Number(quizOpt.getAttribute('data-quiz-opt-idx'));
          this.handleQuizAnswer(idx);
          return;
        }

        const nextQBtn = e.target.closest('[data-action="next-quiz-q"]');
        if (nextQBtn && this.quizActive && this.quizAnswered) {
          this.nextQuizQuestion();
          return;
        }

        const quizAudioBtn = e.target.closest('[data-action="play-quiz-audio"]');
        if (quizAudioBtn) {
          const q = this.quizQuestions[this.quizIndex];
          if (q) audioPlayer.play(q.targetWord.japanese);
          return;
        }

        const restartQuiz = e.target.closest('[data-action="restart-quiz"]');
        if (restartQuiz) {
          this.quizActive = false;
          this.renderGame();
          return;
        }
      }

      // --- MEMORY MATCH ACTIONS ---
      if (this.currentGame === 'memory') {
        const memCard = e.target.closest('[data-mem-card-idx]');
        if (memCard) {
          const idx = Number(memCard.getAttribute('data-mem-card-idx'));
          this.handleMemoryCardClick(idx);
          return;
        }

        const restartMem = e.target.closest('[data-action="restart-memory"]');
        if (restartMem) {
          this.initMemoryGame();
          return;
        }
      }

      // --- UNSCRAMBLE ACTIONS ---
      if (this.currentGame === 'unscramble') {
        const poolTile = e.target.closest('[data-unscramble-pool-idx]');
        if (poolTile) {
          const idx = Number(poolTile.getAttribute('data-unscramble-pool-idx'));
          this.handleUnscramblePoolClick(idx);
          return;
        }

        const userTile = e.target.closest('[data-unscramble-user-idx]');
        if (userTile) {
          const idx = Number(userTile.getAttribute('data-unscramble-user-idx'));
          this.handleUnscrambleUserClick(idx);
          return;
        }

        const checkBtn = e.target.closest('[data-action="check-unscramble"]');
        if (checkBtn) {
          this.checkUnscrambleAnswer();
          return;
        }

        const nextBtn = e.target.closest('[data-action="next-unscramble"]');
        if (nextBtn) {
          this.nextUnscrambleWord();
          return;
        }
      }

      // --- CROSSWORD ACTIONS ---
      if (this.currentGame === 'crossword') {
        const kanaBtn = e.target.closest('[data-crossword-kana]');
        if (kanaBtn) {
          const char = kanaBtn.getAttribute('data-crossword-kana');
          this.handleCrosswordKey(char);
          return;
        }

        const crossCell = e.target.closest('[data-cross-r]');
        if (crossCell) {
          const r = Number(crossCell.getAttribute('data-cross-r'));
          const c = Number(crossCell.getAttribute('data-cross-c'));
          this.selectCrosswordCell(r, c);
          return;
        }

        const clearCellBtn = e.target.closest('[data-action="clear-cross-cell"]');
        if (clearCellBtn) {
          this.clearCrosswordSelectedCell();
          return;
        }

        const checkCrossBtn = e.target.closest('[data-action="check-crossword"]');
        if (checkCrossBtn) {
          this.checkCrosswordSolution();
          return;
        }
      }
    });
  }

  getWordPool() {
    if (this.activeLessonContext && this.activeLessonContext.words && this.activeLessonContext.words.length > 0) {
      return this.activeLessonContext.words;
    }
    return dataManager.getWords();
  }

  initGame(gameName, forceReset = false) {
    if (gameName === 'flashcards') {
      if (forceReset || this.flashcardWords.length === 0) {
        this.flashcardWords = this.getWordPool();
        this.flashcardIndex = 0;
        this.flashcardFlipped = false;
      }
    } else if (gameName === 'quiz') {
      if (forceReset) {
        this.quizActive = false;
      }
    } else if (gameName === 'memory') {
      if (forceReset || this.memoryCards.length === 0) {
        this.initMemoryGame();
      } else if (this.memoryMatched.length < this.memoryCards.length && !this.memoryInterval) {
        this.startMemoryTimer();
      }
    } else if (gameName === 'unscramble') {
      if (forceReset || this.unscrambleWords.length === 0) {
        this.initUnscrambleGame();
      }
    } else if (gameName === 'crossword') {
      if (forceReset || this.crosswordGrid.length === 0) {
        this.initCrosswordLevel();
      }
    }
    this.renderGame();
  }

  /* ==========================================================================
     MEMORY GAME
     ========================================================================== */
  initMemoryGame() {
    const words = this.getWordPool();
    const count = Math.min(6, words.length);
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, count);

    const cards = [];
    shuffledWords.forEach((word, pairId) => {
      cards.push({ id: `jp_${pairId}`, pairId, text: DataManager.formatJapaneseDisplay(word.japanese), type: 'jp', audio: word.japanese });
      cards.push({ id: `en_${pairId}`, pairId, text: word.english, type: 'en', audio: word.japanese });
    });

    this.memoryCards = cards.sort(() => Math.random() - 0.5);
    this.memoryFlipped = [];
    this.memoryMatched = [];
    this.memoryTimer = 0;

    this.startMemoryTimer();
  }

  startMemoryTimer() {
    this.stopMemoryTimer();
    this.memoryInterval = setInterval(() => {
      this.memoryTimer += 1;
      const timerEl = this.element?.querySelector('#memory-timer');
      if (timerEl) timerEl.textContent = `${this.memoryTimer}s`;
    }, 1000);
  }

  stopMemoryTimer() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  handleMemoryCardClick(idx) {
    if (this.memoryFlipped.length >= 2) return;
    if (this.memoryFlipped.includes(idx) || this.memoryMatched.includes(idx)) return;

    this.memoryFlipped.push(idx);
    const card = this.memoryCards[idx];
    if (card && card.audio) {
      audioPlayer.play(card.audio);
    }
    this.renderGame();

    if (this.memoryFlipped.length === 2) {
      const idx1 = this.memoryFlipped[0];
      const idx2 = this.memoryFlipped[1];
      const card1 = this.memoryCards[idx1];
      const card2 = this.memoryCards[idx2];

      if (card1.pairId === card2.pairId) {
        this.memoryMatched.push(idx1, idx2);
        this.memoryFlipped = [];
        if (this.memoryMatched.length === this.memoryCards.length) {
          this.stopMemoryTimer();
          storage.recordMemoryGame(this.memoryTimer);
          showToast(`🎉 You solved the Memory puzzle in ${this.memoryTimer}s!`, 'success');
        }
        this.renderGame();
      } else {
        setTimeout(() => {
          this.memoryFlipped = [];
          this.renderGame();
        }, 1000);
      }
    }
  }

  /* ==========================================================================
     UNSCRAMBLE GAME
     ========================================================================== */
  initUnscrambleGame() {
    const words = this.getWordPool();
    this.unscrambleWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    this.unscrambleIndex = 0;
    this.loadUnscrambleCurrentWord();
  }

  loadUnscrambleCurrentWord() {
    const current = this.unscrambleWords[this.unscrambleIndex];
    if (!current) return;

    const kanaReading = DataManager.extractKanaReading(current.japanese);
    const chars = kanaReading.split('').filter((c) => c !== ' ' && c !== '・' && c !== '~' && c !== '〜');

    this.unscrambleCurrentLetters = chars.map((char, id) => ({ id, char, used: false }));
    this.unscrambleCurrentLetters.sort(() => Math.random() - 0.5);
    this.unscrambleUserLetters = [];
    this.renderGame();
  }

  handleUnscramblePoolClick(poolIdx) {
    const item = this.unscrambleCurrentLetters[poolIdx];
    if (!item || item.used) return;

    item.used = true;
    this.unscrambleUserLetters.push({ poolIdx, char: item.char });
    this.renderGame();
  }

  handleUnscrambleUserClick(userIdx) {
    const removed = this.unscrambleUserLetters.splice(userIdx, 1)[0];
    if (removed) {
      this.unscrambleCurrentLetters[removed.poolIdx].used = false;
    }
    this.renderGame();
  }

  checkUnscrambleAnswer() {
    const current = this.unscrambleWords[this.unscrambleIndex];
    if (!current) return;

    const targetKana = DataManager.extractKanaReading(current.japanese).replace(/[\s・~〜]/g, '');
    const userAns = this.unscrambleUserLetters.map((u) => u.char).join('');

    if (userAns === targetKana) {
      audioPlayer.play(current.japanese);
      storage.recordUnscrambleGame(true);
      showToast('✨ Correct! Excellent job.', 'success');
      this.nextUnscrambleWord();
    } else {
      showToast('❌ Not quite. Try rearranging the tiles!', 'warning');
    }
  }

  nextUnscrambleWord() {
    this.unscrambleIndex += 1;
    if (this.unscrambleIndex >= this.unscrambleWords.length) {
      showToast('🎉 You completed all Unscramble words!', 'success');
      this.currentGame = 'hub';
      this.renderGame();
    } else {
      this.loadUnscrambleCurrentWord();
    }
  }

  /* ==========================================================================
     QUIZ GAME
     ========================================================================== */
  startQuiz() {
    const modeSelect = this.element.querySelector('#quiz-mode-select');
    const countSelect = this.element.querySelector('#quiz-count-select');

    if (modeSelect) this.quizMode = modeSelect.value;
    if (countSelect) this.quizCount = Number(countSelect.value);

    const poolWords = this.getWordPool();
    const allWords = dataManager.getWords(); // Distractors can come from full dataset

    if (poolWords.length < 2) {
      showToast('You need at least 2 vocabulary words to start a quiz!', 'warning');
      return;
    }

    const shuffled = [...poolWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(this.quizCount, shuffled.length));

    this.quizQuestions = selectedWords.map((word) => {
      const otherWords = allWords.filter((w) => w.japanese !== word.japanese);
      const wrongOptions = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [word, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        targetWord: word,
        options,
        correctIndex: options.findIndex((o) => o.japanese === word.japanese)
      };
    });

    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizActive = true;
    this.quizAnswered = false;
    this.quizSelectedOpt = null;

    this.renderGame();
  }

  handleQuizAnswer(optionIndex) {
    this.quizAnswered = true;
    this.quizSelectedOpt = optionIndex;
    const q = this.quizQuestions[this.quizIndex];

    if (optionIndex === q.correctIndex) {
      this.quizScore += 1;
      showToast('Correct! 👏', 'success', 1500);
    } else {
      storage.toggleNeedsReview(q.targetWord.japanese);
      showToast('Incorrect answer', 'error', 1500);
    }

    if (this.quizMode === 'audio' || this.quizMode === 'jp_to_en') {
      audioPlayer.play(q.targetWord.japanese);
    }

    this.renderGame();
  }

  nextQuizQuestion() {
    this.quizIndex += 1;
    this.quizAnswered = false;
    this.quizSelectedOpt = null;

    if (this.quizIndex >= this.quizQuestions.length) {
      this.quizActive = false;
      storage.recordQuizResult(this.quizScore, this.quizQuestions.length, this.quizMode);
    }
    this.renderGame();
  }

  /* ==========================================================================
     KANA CROSSWORD GAME
     ========================================================================== */
  initCrosswordLevel() {
    const words = this.getWordPool();
    const kanaWords = words
      .map((w) => ({
        jp: w.japanese,
        kana: DataManager.extractKanaReading(w.japanese).replace(/[^ぁ-んァ-ン]/g, ''),
        en: w.english
      }))
      .filter((w) => w.kana.length >= 2 && w.kana.length <= 5);

    if (kanaWords.length < 2) {
      this.currentGame = 'hub';
      this.renderGame();
      return;
    }

    const gridSize = 5;
    const grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    const w1 = kanaWords[(this.crosswordLevelIndex * 2) % kanaWords.length];
    const w2 = kanaWords[(this.crosswordLevelIndex * 2 + 1) % kanaWords.length];

    const r1 = 1;
    const c1 = 0;
    for (let i = 0; i < Math.min(w1.kana.length, gridSize); i++) {
      grid[r1][c1 + i] = w1.kana[i];
    }

    const r2 = 0;
    const c2 = 2;
    for (let i = 0; i < Math.min(w2.kana.length, gridSize); i++) {
      grid[r2 + i][c2] = w2.kana[i];
    }

    this.crosswordGrid = grid;
    this.crosswordUserGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(''));

    this.crosswordHints = [
      { num: '1-Across', hint: `${w1.en} (${w1.kana.length} kana)`, r: r1, c: c1 },
      { num: '2-Down', hint: `${w2.en} (${w2.kana.length} kana)`, r: r2, c: c2 }
    ];

    this.crosswordSelectedCell = { r: r1, c: c1 };
    this.renderGame();
  }

  selectCrosswordCell(r, c) {
    if (this.crosswordGrid[r][c] !== null) {
      this.crosswordSelectedCell = { r, c };
      this.renderGame();
    }
  }

  handleCrosswordKey(char) {
    if (!this.crosswordSelectedCell) return;
    const { r, c } = this.crosswordSelectedCell;
    this.crosswordUserGrid[r][c] = char;
    this.renderGame();
  }

  clearCrosswordSelectedCell() {
    if (!this.crosswordSelectedCell) return;
    const { r, c } = this.crosswordSelectedCell;
    this.crosswordUserGrid[r][c] = '';
    this.renderGame();
  }

  checkCrosswordSolution() {
    let isCorrect = true;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const solution = this.crosswordGrid[r][c];
        if (solution !== null && this.crosswordUserGrid[r][c] !== solution) {
          isCorrect = false;
          break;
        }
      }
    }

    if (isCorrect) {
      storage.recordCrosswordSolved(this.crosswordLevelIndex);
      showToast('🎉 Fantastic! Level cleared!', 'success');
      this.crosswordLevelIndex += 1;
      this.initCrosswordLevel();
    } else {
      showToast('❌ Some tiles are incorrect or incomplete. Keep trying!', 'warning');
    }
  }

  /* ==========================================================================
     RENDER SWITCHER
     ========================================================================== */
  renderGame() {
    if (!this.element) return;
    const root = this.element.querySelector('#minigames-root');
    if (!root) return;

    const returnStudyBtnHtml = this.activeLessonContext
      ? `<button type="button" class="btn btn--primary btn--sm" data-action="return-to-study">
          ↩️ Return to Study Session (${this.activeLessonContext.title})
         </button>`
      : '';

    // HUB VIEW
    if (this.currentGame === 'hub') {
      root.innerHTML = `
        ${
          this.activeLessonContext
            ? `<div style="background:var(--primary-soft); border:1px solid var(--primary); border-radius:var(--radius); padding:0.75rem 1rem; margin-bottom:1rem; display:flex; justify-space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                <div>
                  <span style="font-weight:700; color:var(--primary);">Active Lesson Context:</span> ${this.activeLessonContext.title} (${this.activeLessonContext.words.length} words)
                </div>
                ${returnStudyBtnHtml}
               </div>`
            : ''
        }

        <div class="card-grid">
          <article class="card interactive-card" data-launch-game="flashcards">
            <div class="card__icon">🎴</div>
            <h3>Flipcards</h3>
            <p>Interactive study deck with audio, furigana toggles, and mastery tracking.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Flipcards</button>
          </article>

          <article class="card interactive-card" data-launch-game="quiz">
            <div class="card__icon">📝</div>
            <h3>Multiple Choice Quiz</h3>
            <p>Test your speed and accuracy in Japanese to English or Listening prompts.</p>
            <button type="button" class="btn btn--primary btn--sm">Start Quiz</button>
          </article>

          <article class="card interactive-card" data-launch-game="memory">
            <div class="card__icon">🃏</div>
            <h3>Memory Pair Match</h3>
            <p>Match Japanese words with their English translations under time trial.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Memory</button>
          </article>

          <article class="card interactive-card" data-launch-game="unscramble">
            <div class="card__icon">🧩</div>
            <h3>Word Unscramble</h3>
            <p>Arrange Kana tiles in order to spell target Japanese words.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Unscramble</button>
          </article>

          <article class="card interactive-card" data-launch-game="crossword">
            <div class="card__icon">✏️</div>
            <h3>Kana Crossword</h3>
            <p>Solve crossword puzzles cell by cell using Kana keyboard input.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Crossword</button>
          </article>
        </div>
      `;
      return;
    }

    // 1. FLIPCARDS VIEW
    if (this.currentGame === 'flashcards') {
      const currentWord = this.flashcardWords[this.flashcardIndex];
      const isMastered = currentWord ? storage.isWordMastered(currentWord.japanese) : false;
      const isNeedsReview = currentWord ? storage.isNeedsReview(currentWord.japanese) : false;
      const rubyHtml = currentWord ? DataManager.formatJapaneseDisplay(currentWord.japanese) : '';

      root.innerHTML = `
        <div class="content-block" style="max-width:550px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            ${
              returnStudyBtnHtml ||
              `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
            }
            <span class="badge">${this.flashcardWords.length > 0 ? this.flashcardIndex + 1 : 0} / ${this.flashcardWords.length}</span>
            <button type="button" class="btn btn--secondary btn--sm" data-action="fc-shuffle">🔀 Shuffle</button>
          </div>

          <div class="flashcard-wrapper">
            <div class="flashcard ${this.flashcardFlipped ? 'is-flipped' : ''}">
              <div class="flashcard-inner">
                <!-- FRONT -->
                <div class="flashcard-face flashcard-front">
                  <div class="flashcard-header">
                    <span class="badge">${currentWord ? currentWord.topic_ja || currentWord.topic_en || '' : ''}</span>
                    <button type="button" class="btn-icon" data-action="fc-audio" title="Play Audio">🔊</button>
                  </div>
                  <div class="flashcard-body">
                    <h1 class="flashcard-japanese">${rubyHtml}</h1>
                    <p class="flashcard-romaji">${currentWord ? currentWord.romaji : ''}</p>
                  </div>
                  <div class="flashcard-footer">
                    <span class="text-muted" style="font-size:0.85rem;">Click card to flip 🔄</span>
                  </div>
                </div>

                <!-- BACK -->
                <div class="flashcard-face flashcard-back">
                  <div class="flashcard-header">
                    <span class="badge">${currentWord ? currentWord.subtopic_en || '' : ''}</span>
                    <button type="button" class="btn-icon" data-action="fc-audio" title="Play Audio">🔊</button>
                  </div>
                  <div class="flashcard-body">
                    <h2 class="flashcard-english">${currentWord ? currentWord.english : ''}</h2>
                    <p class="flashcard-romaji">${currentWord ? DataManager.formatJapaneseDisplay(currentWord.japanese) : ''} (${currentWord ? currentWord.romaji : ''})</p>
                  </div>
                  <div class="flashcard-actions">
                    <button type="button" class="btn btn--sm ${isNeedsReview ? 'btn--danger' : 'btn--ghost'}" data-action="fc-review">
                      ${isNeedsReview ? '⚠️ Needs Review' : 'Mark Review'}
                    </button>
                    <button type="button" class="btn btn--sm ${isMastered ? 'btn--primary' : 'btn--secondary'}" data-action="fc-master">
                      ${isMastered ? '✓ Mastered' : 'Mark Mastered'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flashcard-nav-controls">
            <button type="button" class="btn btn--secondary" data-action="fc-prev">⬅️ Previous</button>
            <button type="button" class="btn btn--primary" data-action="fc-flip">🔄 Flip Card</button>
            <button type="button" class="btn btn--secondary" data-action="fc-next">Next ➡️</button>
          </div>
        </div>
      `;
      return;
    }

    // 2. QUIZ VIEW
    if (this.currentGame === 'quiz') {
      if (!this.quizActive) {
        root.innerHTML = `
          <div class="content-block" style="max-width:550px; margin:0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
              ${
                returnStudyBtnHtml ||
                `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
              }
            </div>

            <h2 style="margin-bottom:1rem;">Multiple Choice Quiz Setup</h2>

            <div style="margin-bottom:1.25rem;">
              <label style="display:block; font-weight:600; margin-bottom:0.4rem;">Quiz Mode</label>
              <select id="quiz-mode-select" class="form-select" style="width:100%; padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--bg-elevated); color:var(--text);">
                <option value="jp_to_en" ${this.quizMode === 'jp_to_en' ? 'selected' : ''}>Japanese Prompt ➔ English Choice</option>
                <option value="en_to_jp" ${this.quizMode === 'en_to_jp' ? 'selected' : ''}>English Prompt ➔ Japanese Choice</option>
                <option value="audio" ${this.quizMode === 'audio' ? 'selected' : ''}>Audio Listening Prompt ➔ English Choice</option>
              </select>
            </div>

            <div style="margin-bottom:1.5rem;">
              <label style="display:block; font-weight:600; margin-bottom:0.4rem;">Number of Questions</label>
              <select id="quiz-count-select" class="form-select" style="width:100%; padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--bg-elevated); color:var(--text);">
                <option value="5" ${this.quizCount === 5 ? 'selected' : ''}>5 Questions</option>
                <option value="10" ${this.quizCount === 10 ? 'selected' : ''}>10 Questions</option>
                <option value="15" ${this.quizCount === 15 ? 'selected' : ''}>15 Questions</option>
              </select>
            </div>

            <button type="button" class="btn btn--primary" style="width:100%; padding:0.75rem;" data-action="start-quiz">
              🚀 Start Test
            </button>
          </div>
        `;
        return;
      }

      const q = this.quizQuestions[this.quizIndex];
      if (!q) return;

      let promptHtml = '';
      if (this.quizMode === 'jp_to_en') {
        promptHtml = `
          <div style="margin-bottom:1rem;">
            <h1 style="font-size:2.2rem; color:var(--primary); font-weight:800;">${DataManager.formatJapaneseDisplay(q.targetWord.japanese)}</h1>
            <p class="text-muted">${q.targetWord.romaji}</p>
            <button type="button" class="btn btn--secondary btn--sm" style="margin-top:0.5rem;" data-action="play-quiz-audio">🔊 Play Audio</button>
          </div>
        `;
      } else if (this.quizMode === 'en_to_jp') {
        promptHtml = `
          <div style="margin-bottom:1rem;">
            <h1 style="font-size:1.8rem; color:var(--primary); font-weight:700;">"${q.targetWord.english}"</h1>
            <p class="text-muted">Select the correct Japanese word below:</p>
          </div>
        `;
      } else if (this.quizMode === 'audio') {
        promptHtml = `
          <div style="margin-bottom:1.5rem;">
            <button type="button" class="btn btn--primary" style="padding:0.8rem 1.5rem; font-size:1.1rem;" data-action="play-quiz-audio">
              🔊 Play Audio Prompt
            </button>
            <p class="text-muted" style="margin-top:0.5rem;">Listen to spoken Japanese word and select English translation.</p>
          </div>
        `;
      }

      const optionsHtml = q.options
        .map((opt, idx) => {
          let label = this.quizMode === 'en_to_jp' ? `${DataManager.formatJapaneseDisplay(opt.japanese)} (${opt.romaji})` : opt.english;
          let btnClass = 'btn btn--secondary quiz-option-btn';
          if (this.quizAnswered) {
            if (idx === q.correctIndex) {
              btnClass += ' option-correct';
            } else if (idx === this.quizSelectedOpt) {
              btnClass += ' option-wrong';
            }
          }

          return `
            <button type="button" class="${btnClass}" data-quiz-opt-idx="${idx}" ${this.quizAnswered ? 'disabled' : ''}>
              ${label}
            </button>
          `;
        })
        .join('');

      root.innerHTML = `
        <div class="content-block quiz-card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            ${
              returnStudyBtnHtml ||
              `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
            }
            <span class="badge">Question ${this.quizIndex + 1} of ${this.quizQuestions.length}</span>
            <span class="text-muted" style="font-size:0.9rem; font-weight:600;">Score: ${this.quizScore}</span>
          </div>

          <div class="text-center" style="padding:1rem 0;">
            ${promptHtml}
          </div>

          <div class="quiz-options-grid">
            ${optionsHtml}
          </div>

          ${
            this.quizAnswered
              ? `
            <div style="margin-top:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              ${returnStudyBtnHtml}
              <button type="button" class="btn btn--primary" data-action="next-quiz-q">
                ${this.quizIndex + 1 === this.quizQuestions.length ? 'View Results 🏆' : 'Next Question ➡️'}
              </button>
            </div>
          `
              : ''
          }
        </div>
      `;
      return;
    }

    // 3. MEMORY VIEW
    if (this.currentGame === 'memory') {
      const isWon = this.memoryMatched.length === this.memoryCards.length && this.memoryCards.length > 0;

      root.innerHTML = `
        <div class="content-block">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            ${
              returnStudyBtnHtml ||
              `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
            }
            <span class="badge" id="memory-timer">${this.memoryTimer}s</span>
          </div>

          <div class="memory-grid">
            ${this.memoryCards
              .map((card, idx) => {
                const isFlipped = this.memoryFlipped.includes(idx) || this.memoryMatched.includes(idx);
                const isMatched = this.memoryMatched.includes(idx);

                return `
                  <div class="memory-card ${isFlipped ? 'is-flipped' : ''} ${isMatched ? 'is-matched' : ''}" data-mem-card-idx="${idx}">
                    <div class="memory-card-face memory-card-front">❓</div>
                    <div class="memory-card-face memory-card-back">${card.text}</div>
                  </div>
                `;
              })
              .join('')}
          </div>

          ${
            isWon
              ? `
            <div class="text-center" style="margin-top:1.5rem; display:flex; flex-direction:column; align-items:center; gap:0.75rem;">
              <h2>🎉 Puzzle Solved in ${this.memoryTimer} seconds!</h2>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="btn btn--primary" data-action="restart-memory">Play Again</button>
                ${returnStudyBtnHtml}
              </div>
            </div>
          `
              : ''
          }
        </div>
      `;
      return;
    }

    // 4. UNSCRAMBLE VIEW
    if (this.currentGame === 'unscramble') {
      const current = this.unscrambleWords[this.unscrambleIndex];

      root.innerHTML = `
        <div class="content-block" style="max-width:600px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            ${
              returnStudyBtnHtml ||
              `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
            }
            <span class="badge">Word ${this.unscrambleIndex + 1} of ${this.unscrambleWords.length}</span>
          </div>

          <div class="text-center" style="margin-bottom:1.5rem;">
            <p class="text-muted">Target Meaning:</p>
            <h2 style="color:var(--primary);">${current ? current.english : ''}</h2>
            <p class="text-muted" style="font-size:0.9rem;">Subtopic: ${current ? current.subtopic_en : ''}</p>
          </div>

          <!-- Selected user slots -->
          <div class="unscramble-user-container">
            ${
              this.unscrambleUserLetters.length === 0
                ? '<span class="text-muted">Click letter tiles below to spell word...</span>'
                : this.unscrambleUserLetters
                    .map(
                      (u, idx) => `
                    <button type="button" class="tile-btn tile-user" data-unscramble-user-idx="${idx}">${u.char}</button>
                  `
                    )
                    .join('')
            }
          </div>

          <!-- Available pool tiles -->
          <div class="unscramble-pool-container" style="margin-top:1.5rem;">
            ${this.unscrambleCurrentLetters
              .map(
                (item, idx) => `
                <button type="button" class="tile-btn ${item.used ? 'tile-used' : ''}" data-unscramble-pool-idx="${idx}" ${item.used ? 'disabled' : ''}>${item.char}</button>
              `
              )
              .join('')}
          </div>

          <div style="display:flex; justify-content:center; gap:0.75rem; margin-top:2rem; flex-wrap:wrap;">
            <button type="button" class="btn btn--primary" data-action="check-unscramble">Check Word</button>
            <button type="button" class="btn btn--secondary" data-action="next-unscramble">Skip Word</button>
          </div>
        </div>
      `;
      return;
    }

    // 5. CROSSWORD VIEW
    if (this.currentGame === 'crossword') {
      const kanaPalette = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん','っ','ゃ','ゅ','ょ','ー'];

      root.innerHTML = `
        <div class="content-block">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:1rem;">
            ${
              returnStudyBtnHtml ||
              `<button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games Hub</button>`
            }
            <span class="badge">Crossword Level ${this.crosswordLevelIndex + 1}</span>
          </div>

          <div class="crossword-layout">
            <div>
              <div class="crossword-grid-board">
                ${this.crosswordGrid
                  .map((row, r) =>
                    row
                      .map((cell, c) => {
                        if (cell === null) {
                          return `<div class="cross-cell cross-block"></div>`;
                        }
                        const isSel = this.crosswordSelectedCell && this.crosswordSelectedCell.r === r && this.crosswordSelectedCell.c === c;
                        const val = this.crosswordUserGrid[r][c] || '';
                        return `
                          <div class="cross-cell cross-active ${isSel ? 'is-selected' : ''}" data-cross-r="${r}" data-cross-c="${c}">
                            ${val}
                          </div>
                        `;
                      })
                      .join('')
                  )
                  .join('')}
              </div>

              <div style="display:flex; justify-content:center; gap:0.5rem; margin-top:1rem;">
                <button type="button" class="btn btn--secondary btn--sm" data-action="clear-cross-cell">Clear Tile</button>
                <button type="button" class="btn btn--primary btn--sm" data-action="check-crossword">Check Solution</button>
              </div>
            </div>

            <div>
              <h3>Hints</h3>
              <ul style="list-style:none; padding:0; margin:0.5rem 0 1rem 0;">
                ${this.crosswordHints
                  .map(
                    (h) => `
                  <li style="margin-bottom:0.4rem; font-size:0.95rem;">
                    <strong>${h.num}:</strong> ${h.hint}
                  </li>
                `
                  )
                  .join('')}
              </ul>

              <h4>Kana Keyboard</h4>
              <div class="kana-keyboard-grid">
                ${kanaPalette
                  .map(
                    (char) => `
                  <button type="button" class="kana-key-btn" data-crossword-kana="${char}">${char}</button>
                `
                  )
                  .join('')}
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }
  }

  render() {
    return `
      <div class="page-header">
        <h1>Minigames (日本語ゲーム)</h1>
        <p>Fun interactive practice games for Japanese reading, quizzes, and vocabulary.</p>
      </div>

      <div id="minigames-root">
        <!-- Rendered dynamically -->
      </div>

      <footer class="module-footer">
        Module 2 · Minigames
      </footer>
    `;
  }
}
