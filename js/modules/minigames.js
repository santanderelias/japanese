/**
 * Minigames Module (3) — Includes Memory Match, Word Unscramble, and Kana Crossword puzzle games.
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';

export class MinigameModule extends Module {
  constructor() {
    super({
      id: 3,
      name: 'Minigames',
      navLabel: 'ゲーム (Games)',
      navOrder: 3
    });

    this.currentGame = 'hub'; // 'hub', 'memory', 'unscramble', 'crossword'

    // Memory Game State
    this.memoryCards = [];
    this.memoryFlipped = [];
    this.memoryMatched = [];
    this.memoryTimer = 0;
    this.memoryInterval = null;

    // Word Unscramble State
    this.unscrambleWords = [];
    this.unscrambleIndex = 0;
    this.unscrambleCurrentLetters = [];
    this.unscrambleUserLetters = [];

    // Crossword State
    this.crosswordLevelIndex = 0;
    this.crosswordGrid = [];
    this.crosswordUserGrid = [];
    this.crosswordHints = [];
  }

  show() {
    super.show();
    this.renderGame();
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const launchBtn = e.target.closest('[data-launch-game]');
      if (launchBtn) {
        this.currentGame = launchBtn.getAttribute('data-launch-game');
        this.initGame(this.currentGame);
        return;
      }

      const backBtn = e.target.closest('[data-action="back-to-hub"]');
      if (backBtn) {
        this.stopMemoryTimer();
        this.currentGame = 'hub';
        this.renderGame();
        return;
      }

      // Memory match card clicks
      const memCard = e.target.closest('[data-mem-card-idx]');
      if (memCard && this.currentGame === 'memory') {
        const idx = Number(memCard.getAttribute('data-mem-card-idx'));
        this.handleMemoryCardClick(idx);
        return;
      }

      // Unscramble letter tile clicks
      const poolTile = e.target.closest('[data-unscramble-pool-idx]');
      if (poolTile && this.currentGame === 'unscramble') {
        const idx = Number(poolTile.getAttribute('data-unscramble-pool-idx'));
        this.handleUnscramblePoolClick(idx);
        return;
      }

      const userTile = e.target.closest('[data-unscramble-user-idx]');
      if (userTile && this.currentGame === 'unscramble') {
        const idx = Number(userTile.getAttribute('data-unscramble-user-idx'));
        this.handleUnscrambleUserClick(idx);
        return;
      }

      const checkUnscrambleBtn = e.target.closest('[data-action="check-unscramble"]');
      if (checkUnscrambleBtn) {
        this.checkUnscrambleAnswer();
        return;
      }

      const nextUnscrambleBtn = e.target.closest('[data-action="next-unscramble"]');
      if (nextUnscrambleBtn) {
        this.nextUnscrambleWord();
        return;
      }

      // Crossword clicks
      const kanaBtn = e.target.closest('[data-crossword-kana]');
      if (kanaBtn && this.currentGame === 'crossword') {
        const char = kanaBtn.getAttribute('data-crossword-kana');
        this.handleCrosswordKey(char);
        return;
      }

      const crossCell = e.target.closest('[data-cross-r]');
      if (crossCell && this.currentGame === 'crossword') {
        const r = Number(crossCell.getAttribute('data-cross-r'));
        const c = Number(crossCell.getAttribute('data-cross-c'));
        this.selectCrosswordCell(r, c);
        return;
      }

      const clearCellBtn = e.target.closest('[data-action="clear-cross-cell"]');
      if (clearCellBtn && this.currentGame === 'crossword') {
        this.clearCrosswordSelectedCell();
        return;
      }

      const checkCrossBtn = e.target.closest('[data-action="check-crossword"]');
      if (checkCrossBtn && this.currentGame === 'crossword') {
        this.checkCrosswordSolution();
        return;
      }

      const nextLevelBtn = e.target.closest('[data-action="next-crossword-level"]');
      if (nextLevelBtn && this.currentGame === 'crossword') {
        this.crosswordLevelIndex += 1;
        this.initCrosswordLevel();
        return;
      }
    });
  }

  initGame(gameName) {
    if (gameName === 'memory') {
      this.initMemoryGame();
    } else if (gameName === 'unscramble') {
      this.initUnscrambleGame();
    } else if (gameName === 'crossword') {
      this.initCrosswordLevel();
    } else {
      this.renderGame();
    }
  }

  /* ==========================================================================
     1. MEMORY MATCH GAME
     ========================================================================== */
  initMemoryGame() {
    const words = dataManager.getWords();
    const count = Math.min(6, words.length);
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, count);

    const cards = [];
    shuffledWords.forEach((word, pairId) => {
      cards.push({ id: `jp_${pairId}`, pairId, text: word.japanese, type: 'jp', audio: word.japanese });
      cards.push({ id: `en_${pairId}`, pairId, text: word.english, type: 'en', audio: word.japanese });
    });

    this.memoryCards = cards.sort(() => Math.random() - 0.5);
    this.memoryFlipped = [];
    this.memoryMatched = [];
    this.memoryTimer = 0;

    this.stopMemoryTimer();
    this.memoryInterval = setInterval(() => {
      this.memoryTimer += 1;
      const timerEl = this.element.querySelector('#memory-timer');
      if (timerEl) timerEl.textContent = `${this.memoryTimer}s`;
    }, 1000);

    this.renderGame();
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
     2. WORD UNSCRAMBLE GAME
     ========================================================================== */
  initUnscrambleGame() {
    const words = dataManager.getWords();
    this.unscrambleWords = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    this.unscrambleIndex = 0;
    this.loadUnscrambleCurrentWord();
  }

  loadUnscrambleCurrentWord() {
    const current = this.unscrambleWords[this.unscrambleIndex];
    if (!current) return;

    // Use pure Kana reading for unscramble
    const kanaReading = DataManager.extractKanaReading(current.japanese);
    const chars = kanaReading.split('').filter((c) => c !== ' ' && c !== '・');

    this.unscrambleCurrentLetters = chars.map((char, id) => ({ id, char, used: false }));
    // Shuffle pool
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
    const targetKana = DataManager.extractKanaReading(current.japanese).replace(/[\s・]/g, '');
    const userAns = this.unscrambleUserLetters.map((u) => u.char).join('');

    if (userAns === targetKana) {
      audioPlayer.play(current.japanese);
      storage.recordUnscrambleGame(true);
      alert('✨ Correct! Excellent job.');
      this.nextUnscrambleWord();
    } else {
      alert('❌ Not quite. Try rearranging the tiles!');
    }
  }

  nextUnscrambleWord() {
    this.unscrambleIndex += 1;
    if (this.unscrambleIndex >= this.unscrambleWords.length) {
      alert('🎉 You completed all Unscramble words!');
      this.currentGame = 'hub';
      this.renderGame();
    } else {
      this.loadUnscrambleCurrentWord();
    }
  }

  /* ==========================================================================
     3. KANA CROSSWORD PUZZLE GAME
     ========================================================================== */
  initCrosswordLevel() {
    // Generate crossword levels dynamically from vocabulary words using Kana readings
    const words = dataManager.getWords();
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

    // Build a simple 5x5 grid crossword
    const gridSize = 5;
    const grid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    // Select 2 crossing words or 3 parallel words for level
    const w1 = kanaWords[(this.crosswordLevelIndex * 2) % kanaWords.length];
    const w2 = kanaWords[(this.crosswordLevelIndex * 2 + 1) % kanaWords.length];

    // Word 1 across at row 1
    const r1 = 1;
    const c1 = 0;
    for (let i = 0; i < Math.min(w1.kana.length, gridSize); i++) {
      grid[r1][c1 + i] = w1.kana[i];
    }

    // Word 2 down at col 2
    const r2 = 0;
    const c2 = 2;
    for (let i = 0; i < Math.min(w2.kana.length, gridSize); i++) {
      // If collision, keep existing or overwrite
      grid[r2 + i][c2] = w2.kana[i];
    }

    this.crosswordGrid = grid;
    this.crosswordUserGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(''));

    this.crosswordHints = [
      { num: '1-Across', hint: `${w1.en} (${w1.kana.length} kana)`, r: r1, c: c1, dir: 'across' },
      { num: '2-Down', hint: `${w2.en} (${w2.kana.length} kana)`, r: r2, c: c2, dir: 'down' }
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
      alert('🎉 Fantastic! Level cleared!');
      this.crosswordLevelIndex += 1;
      this.initCrosswordLevel();
    } else {
      alert('❌ Some tiles are incorrect or incomplete. Keep trying!');
    }
  }

  /* ==========================================================================
     RENDER SWITCHER
     ========================================================================== */
  renderGame() {
    if (!this.element) return;
    const root = this.element.querySelector('#minigames-root');
    if (!root) return;

    if (this.currentGame === 'hub') {
      root.innerHTML = `
        <div class="card-grid">
          <article class="card interactive-card" data-launch-game="memory">
            <div class="card__icon">🃏</div>
            <h3>Memory Pair Match</h3>
            <p>Match Japanese words with their English translations.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Memory</button>
          </article>

          <article class="card interactive-card" data-launch-game="unscramble">
            <div class="card__icon">🧩</div>
            <h3>Word Unscramble</h3>
            <p>Arrange Kana tiles in order to spell the target word.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Unscramble</button>
          </article>

          <article class="card interactive-card" data-launch-game="crossword">
            <div class="card__icon">✏️</div>
            <h3>Kana Crossword</h3>
            <p>Solve crossword puzzles cell by cell using Kana keyboard.</p>
            <button type="button" class="btn btn--primary btn--sm">Play Crossword</button>
          </article>
        </div>
      `;
    } else if (this.currentGame === 'memory') {
      const isWon = this.memoryMatched.length === this.memoryCards.length && this.memoryCards.length > 0;

      root.innerHTML = `
        <div class="content-block">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games</button>
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
            <div class="text-center" style="margin-top:1.5rem;">
              <h2>🎉 Puzzle Solved in ${this.memoryTimer} seconds!</h2>
              <button type="button" class="btn btn--primary" data-launch-game="memory" style="margin-top:0.75rem;">Play Again</button>
            </div>
          `
              : ''
          }
        </div>
      `;
    } else if (this.currentGame === 'unscramble') {
      const current = this.unscrambleWords[this.unscrambleIndex];

      root.innerHTML = `
        <div class="content-block" style="max-width:600px; margin:0 auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games</button>
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

          <div style="display:flex; justify-content:center; gap:0.75rem; margin-top:2rem;">
            <button type="button" class="btn btn--primary" data-action="check-unscramble">Check Word</button>
            <button type="button" class="btn btn--secondary" data-action="next-unscramble">Skip Word</button>
          </div>
        </div>
      `;
    } else if (this.currentGame === 'crossword') {
      const kanaPalette = ['あ','い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん','っ','ゃ','ゅ','ょ','ー'];

      root.innerHTML = `
        <div class="content-block">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <button type="button" class="btn btn--ghost btn--sm" data-action="back-to-hub">⬅️ Back to Games</button>
            <span class="badge">Crossword Level ${this.crosswordLevelIndex + 1}</span>
          </div>

          <div style="display:grid; grid-template-columns:1fr; gap:1.5rem;" class="crossword-layout">
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
    }
  }

  render() {
    return `
      <div class="page-header">
        <h1>Minigames (日本語ゲーム)</h1>
        <p>Fun interactive practice games for Japanese reading and vocabulary.</p>
      </div>

      <div id="minigames-root">
        <!-- Rendered dynamically -->
      </div>

      <footer class="module-footer">
        Module 3 · Minigames
      </footer>
    `;
  }
}
