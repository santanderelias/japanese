/**
 * Quiz Module (2) — Configurable Japanese testing & quiz engine.
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';
import { showToast } from '../ui.js';

export class QuizModule extends Module {
  constructor() {
    super({
      id: 2,
      name: 'Quiz & Tests',
      navLabel: 'テスト (Quiz)',
      navOrder: 2
    });

    this.mode = 'jp_to_en'; // 'jp_to_en', 'en_to_jp', 'audio'
    this.questionCount = 10;
    this.questions = [];
    this.currentQIndex = 0;
    this.score = 0;
    this.quizActive = false;
    this.selectedOptionIndex = null;
    this.isAnswered = false;
  }

  show() {
    super.show();
    if (!this.quizActive) {
      this.renderSetup();
    }
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const startBtn = e.target.closest('[data-action="start-quiz"]');
      if (startBtn) {
        this.startQuiz();
        return;
      }

      const optBtn = e.target.closest('[data-option-index]');
      if (optBtn && this.quizActive && !this.isAnswered) {
        const idx = Number(optBtn.getAttribute('data-option-index'));
        this.handleAnswer(idx);
        return;
      }

      const nextQBtn = e.target.closest('[data-action="next-question"]');
      if (nextQBtn && this.quizActive && this.isAnswered) {
        this.nextQuestion();
        return;
      }

      const audioBtn = e.target.closest('[data-action="play-q-audio"]');
      if (audioBtn) {
        const q = this.questions[this.currentQIndex];
        if (q) audioPlayer.play(q.targetWord.japanese);
        return;
      }

      const restartBtn = e.target.closest('[data-action="restart-quiz"]');
      if (restartBtn) {
        this.quizActive = false;
        this.renderSetup();
        return;
      }
    });
  }

  startQuiz() {
    const modeSelect = this.element.querySelector('#quiz-mode-select');
    const countSelect = this.element.querySelector('#quiz-count-select');

    if (modeSelect) this.mode = modeSelect.value;
    if (countSelect) this.questionCount = Number(countSelect.value);

    const allWords = dataManager.getWords();
    if (allWords.length < 4) {
      showToast('You need at least 4 vocabulary words in dataset to start a quiz!', 'warning');
      return;
    }

    // Shuffle and slice questions
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(this.questionCount, shuffled.length));

    this.questions = selectedWords.map((word) => {
      // Pick 3 wrong options
      const otherWords = allWords.filter((w) => w.japanese !== word.japanese);
      const wrongOptions = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [word, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        targetWord: word,
        options,
        correctIndex: options.findIndex((o) => o.japanese === word.japanese)
      };
    });

    this.currentQIndex = 0;
    this.score = 0;
    this.quizActive = true;
    this.isAnswered = false;
    this.selectedOptionIndex = null;

    this.renderQuestion();
  }

  handleAnswer(optionIndex) {
    this.isAnswered = true;
    this.selectedOptionIndex = optionIndex;
    const q = this.questions[this.currentQIndex];

    if (optionIndex === q.correctIndex) {
      this.score += 1;
    } else {
      // Add wrong word to needs review
      storage.toggleNeedsReview(q.targetWord.japanese);
    }

    if (this.mode === 'audio' || this.mode === 'jp_to_en') {
      audioPlayer.play(q.targetWord.japanese);
    }

    this.renderQuestion();
  }

  nextQuestion() {
    this.currentQIndex += 1;
    this.isAnswered = false;
    this.selectedOptionIndex = null;

    if (this.currentQIndex >= this.questions.length) {
      this.finishQuiz();
    } else {
      this.renderQuestion();
    }
  }

  finishQuiz() {
    this.quizActive = false;
    storage.recordQuizResult(this.score, this.questions.length, this.mode);

    const root = this.element.querySelector('#quiz-main-root');
    const pct = Math.round((this.score / this.questions.length) * 100);

    if (root) {
      root.innerHTML = `
        <div class="content-block text-center" style="padding: 2.5rem 1rem;">
          <h1 style="font-size:3rem; margin-bottom:0.5rem;">${pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</h1>
          <h2>Quiz Completed!</h2>
          <p style="font-size:1.2rem; margin:0.8rem 0; color:var(--primary); font-weight:700;">
            Your Score: ${this.score} / ${this.questions.length} (${pct}%)
          </p>
          <p class="text-muted">
            ${pct >= 80 ? 'Great job! You are mastering this vocabulary.' : 'Keep practicing! Words missed were added to Needs Review.'}
          </p>
          <div style="margin-top:1.5rem; display:flex; justify-content:center; gap:0.75rem;">
            <button type="button" class="btn btn--primary" data-action="restart-quiz">Try Another Quiz</button>
          </div>
        </div>
      `;
    }
  }

  renderSetup() {
    const root = this.element.querySelector('#quiz-main-root');
    if (!root) return;

    root.innerHTML = `
      <div class="content-block" style="max-width:550px; margin:0 auto;">
        <h2 style="margin-bottom:1rem;">Quiz Configuration</h2>

        <div style="margin-bottom:1.25rem;">
          <label style="display:block; font-weight:600; margin-bottom:0.4rem;">Quiz Mode</label>
          <select id="quiz-mode-select" class="form-select" style="width:100%; padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--bg-elevated); color:var(--text);">
            <option value="jp_to_en">Japanese Prompt ➔ English Choice</option>
            <option value="en_to_jp">English Prompt ➔ Japanese Choice</option>
            <option value="audio">Audio Listening Prompt ➔ English Choice</option>
          </select>
        </div>

        <div style="margin-bottom:1.5rem;">
          <label style="display:block; font-weight:600; margin-bottom:0.4rem;">Number of Questions</label>
          <select id="quiz-count-select" class="form-select" style="width:100%; padding:0.6rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--bg-elevated); color:var(--text);">
            <option value="5">5 Questions</option>
            <option value="10" selected>10 Questions</option>
            <option value="15">15 Questions</option>
            <option value="20">20 Questions</option>
          </select>
        </div>

        <button type="button" class="btn btn--primary" style="width:100%; padding:0.75rem;" data-action="start-quiz">
          🚀 Start Test
        </button>
      </div>
    `;
  }

  renderQuestion() {
    const root = this.element.querySelector('#quiz-main-root');
    if (!root) return;

    const q = this.questions[this.currentQIndex];
    if (!q) return;

    let promptHtml = '';
    if (this.mode === 'jp_to_en') {
      promptHtml = `
        <div style="margin-bottom:1rem;">
          <h1 style="font-size:2.2rem; color:var(--primary); font-weight:800;">${DataManager.formatJapaneseDisplay(q.targetWord.japanese)}</h1>
          <p class="text-muted">${q.targetWord.romaji}</p>
          <button type="button" class="btn btn--secondary btn--sm" style="margin-top:0.5rem;" data-action="play-q-audio">🔊 Play Audio</button>
        </div>
      `;
    } else if (this.mode === 'en_to_jp') {
      promptHtml = `
        <div style="margin-bottom:1rem;">
          <h1 style="font-size:1.8rem; color:var(--primary); font-weight:700;">"${q.targetWord.english}"</h1>
          <p class="text-muted">Select the correct Japanese word below:</p>
        </div>
      `;
    } else if (this.mode === 'audio') {
      promptHtml = `
        <div style="margin-bottom:1.5rem;">
          <button type="button" class="btn btn--primary" style="padding:0.8rem 1.5rem; font-size:1.1rem;" data-action="play-q-audio">
            🔊 Play Audio Prompt
          </button>
          <p class="text-muted" style="margin-top:0.5rem;">Listen to the spoken Japanese word and select its English translation.</p>
        </div>
      `;
      // Auto play audio prompt when question mounts
      if (!this.isAnswered) {
        audioPlayer.play(q.targetWord.japanese);
      }
    }

    const optionsHtml = q.options
      .map((opt, idx) => {
        let label = '';
        if (this.mode === 'jp_to_en' || this.mode === 'audio') {
          label = opt.english;
        } else {
          label = `${DataManager.formatJapaneseDisplay(opt.japanese)} (${opt.romaji})`;
        }

        let btnClass = 'btn btn--secondary quiz-option-btn';
        if (this.isAnswered) {
          if (idx === q.correctIndex) {
            btnClass += ' option-correct';
          } else if (idx === this.selectedOptionIndex) {
            btnClass += ' option-wrong';
          }
        }

        return `
          <button type="button" class="${btnClass}" data-option-index="${idx}" ${this.isAnswered ? 'disabled' : ''}>
            ${label}
          </button>
        `;
      })
      .join('');

    root.innerHTML = `
      <div class="content-block quiz-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <span class="badge">Question ${this.currentQIndex + 1} of ${this.questions.length}</span>
          <span class="text-muted" style="font-size:0.9rem; font-weight:600;">Score: ${this.score}</span>
        </div>

        <div class="text-center" style="padding:1rem 0;">
          ${promptHtml}
        </div>

        <div class="quiz-options-grid">
          ${optionsHtml}
        </div>

        ${
          this.isAnswered
            ? `
          <div style="margin-top:1.5rem; text-align:right;">
            <button type="button" class="btn btn--primary" data-action="next-question">
              ${this.currentQIndex + 1 === this.questions.length ? 'View Results 🏆' : 'Next Question ➡️'}
            </button>
          </div>
        `
            : ''
        }
      </div>
    `;
  }

  render() {
    return `
      <div class="page-header">
        <h1>Quiz & Tests (テスト)</h1>
        <p>Test your Japanese comprehension with instant feedback.</p>
      </div>

      <div id="quiz-main-root">
        <!-- Rendered dynamically -->
      </div>

      <footer class="module-footer">
        Module 2 · Quiz & Tests
      </footer>
    `;
  }
}
