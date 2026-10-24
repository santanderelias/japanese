/**
 * Flashcards Module (1) — Flip card study mode with topic filter and audio.
 */

import { Module } from './base.js';
import { dataManager, DataManager } from '../data.js';
import { storage } from '../storage.js';
import { audioPlayer } from '../audio.js';

export class FlashcardModule extends Module {
  constructor() {
    super({
      id: 1,
      name: 'Flashcards',
      navLabel: '単語 (Cards)',
      navOrder: 1
    });
    this.words = [];
    this.currentIndex = 0;
    this.isFlipped = false;
  }

  show() {
    super.show();
    this.loadWords();
    this.renderCard();
  }

  loadWords() {
    this.words = dataManager.getWords();
    if (this.currentIndex >= this.words.length) {
      this.currentIndex = 0;
    }
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const flipBtn = e.target.closest('[data-action="flip"]');
      if (flipBtn || e.target.closest('.flashcard-inner')) {
        this.toggleFlip();
        return;
      }

      const nextBtn = e.target.closest('[data-action="next"]');
      if (nextBtn) {
        this.nextCard();
        return;
      }

      const prevBtn = e.target.closest('[data-action="prev"]');
      if (prevBtn) {
        this.prevCard();
        return;
      }

      const audioBtn = e.target.closest('[data-action="audio"]');
      if (audioBtn) {
        e.stopPropagation();
        const currentWord = this.words[this.currentIndex];
        if (currentWord) audioPlayer.play(currentWord.japanese);
        return;
      }

      const masterBtn = e.target.closest('[data-action="toggle-master"]');
      if (masterBtn) {
        e.stopPropagation();
        const currentWord = this.words[this.currentIndex];
        if (currentWord) {
          storage.toggleWordMastered(currentWord.japanese);
          this.loadWords();
          this.renderCard();
        }
        return;
      }

      const reviewBtn = e.target.closest('[data-action="toggle-review"]');
      if (reviewBtn) {
        e.stopPropagation();
        const currentWord = this.words[this.currentIndex];
        if (currentWord) {
          storage.toggleNeedsReview(currentWord.japanese);
          this.loadWords();
          this.renderCard();
        }
        return;
      }

      const shuffleBtn = e.target.closest('[data-action="shuffle"]');
      if (shuffleBtn) {
        this.shuffleWords();
        return;
      }
    });

    const topicSelect = this.element.querySelector('#flashcard-topic-filter');
    if (topicSelect) {
      topicSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'all') {
          storage.settings.selectedTopics = [];
        } else {
          storage.settings.selectedTopics = [val];
        }
        storage.saveSettings();
        this.currentIndex = 0;
        this.loadWords();
        this.renderCard();
      });
    }
  }

  shuffleWords() {
    for (let i = this.words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.words[i], this.words[j]] = [this.words[j], this.words[i]];
    }
    this.currentIndex = 0;
    this.isFlipped = false;
    this.renderCard();
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    const cardEl = this.element.querySelector('.flashcard');
    if (cardEl) {
      cardEl.classList.toggle('is-flipped', this.isFlipped);
    }
  }

  nextCard() {
    if (this.words.length === 0) return;
    this.isFlipped = false;
    this.currentIndex = (this.currentIndex + 1) % this.words.length;
    this.renderCard();
  }

  prevCard() {
    if (this.words.length === 0) return;
    this.isFlipped = false;
    this.currentIndex = (this.currentIndex - 1 + this.words.length) % this.words.length;
    this.renderCard();
  }

  renderCard() {
    if (!this.element) return;
    this.populateTopicDropdown();

    const currentWord = this.words[this.currentIndex];
    const cardContainer = this.element.querySelector('#flashcard-container');
    const counterEl = this.element.querySelector('#flashcard-counter');

    if (!currentWord || this.words.length === 0) {
      if (cardContainer) {
        cardContainer.innerHTML = `
          <div class="content-block text-center" style="padding: 3rem 1rem;">
            <h3>No words match your selected filter!</h3>
            <p>Try changing topic filter in Settings or top bar.</p>
          </div>
        `;
      }
      if (counterEl) counterEl.textContent = '0 / 0';
      return;
    }

    if (counterEl) {
      counterEl.textContent = `${this.currentIndex + 1} / ${this.words.length}`;
    }

    const isMastered = storage.isWordMastered(currentWord.japanese);
    const isNeedsReview = storage.isNeedsReview(currentWord.japanese);

    const rubyHtml = DataManager.formatJapaneseDisplay(currentWord.japanese);

    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="flashcard ${this.isFlipped ? 'is-flipped' : ''}">
          <div class="flashcard-inner">
            <!-- FRONT SIDE -->
            <div class="flashcard-face flashcard-front">
              <div class="flashcard-header">
                <span class="badge">${currentWord.topic_ja} · ${currentWord.subtopic_ja}</span>
                <button type="button" class="btn-icon" data-action="audio" title="Play Audio">🔊</button>
              </div>
              <div class="flashcard-body">
                <h1 class="flashcard-japanese">${rubyHtml}</h1>
                <p class="flashcard-romaji">${currentWord.romaji}</p>
              </div>
              <div class="flashcard-footer">
                <span class="text-muted" style="font-size:0.85rem;">Click card to flip 🔄</span>
              </div>
            </div>

            <!-- BACK SIDE -->
            <div class="flashcard-face flashcard-back">
              <div class="flashcard-header">
                <span class="badge">${currentWord.subtopic_en}</span>
                <button type="button" class="btn-icon" data-action="audio" title="Play Audio">🔊</button>
              </div>
              <div class="flashcard-body">
                <h2 class="flashcard-english">${currentWord.english}</h2>
                <p class="flashcard-romaji">${rubyHtml} (${currentWord.romaji})</p>
              </div>
              <div class="flashcard-actions">
                <button type="button" class="btn btn--sm ${isNeedsReview ? 'btn--danger' : 'btn--ghost'}" data-action="toggle-review">
                  ${isNeedsReview ? '⚠️ Needs Review' : 'Mark Review'}
                </button>
                <button type="button" class="btn btn--sm ${isMastered ? 'btn--primary' : 'btn--secondary'}" data-action="toggle-master">
                  ${isMastered ? '✓ Mastered' : 'Mark Mastered'}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  populateTopicDropdown() {
    const topicSelect = this.element.querySelector('#flashcard-topic-filter');
    if (!topicSelect) return;

    const topics = dataManager.getAllTopics();
    const currentSelected = storage.settings.selectedTopics[0] || 'all';

    let options = `<option value="all" ${currentSelected === 'all' ? 'selected' : ''}>All Topics (${topics.length})</option>`;
    for (const t of topics) {
      const key = `${t.datasetId}_${t.topic_id}`;
      const isSel = currentSelected === key || currentSelected === t.topic_id;
      options += `<option value="${key}" ${isSel ? 'selected' : ''}>${t.topic_ja} (${t.topic_en})</option>`;
    }

    topicSelect.innerHTML = options;
  }

  render() {
    return `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>Flashcards (単語カード)</h1>
          <p>Interactive study deck with audio and mastery tracking.</p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <select id="flashcard-topic-filter" class="form-select" style="padding:0.4rem 0.8rem; border-radius:var(--radius-sm); border:1px solid var(--border); background:var(--bg-elevated); color:var(--text);">
            <option value="all">All Topics</option>
          </select>
          <button type="button" class="btn btn--secondary btn--sm" data-action="shuffle" title="Shuffle Deck">
            🔀 Shuffle
          </button>
        </div>
      </div>

      <div style="display:flex; justify-content:center; margin-bottom:1rem;">
        <span id="flashcard-counter" class="badge" style="font-size:1rem; padding:0.4rem 1rem;">1 / 1</span>
      </div>

      <div id="flashcard-container" class="flashcard-wrapper">
        <!-- Card rendered dynamically -->
      </div>

      <div class="flashcard-nav-controls">
        <button type="button" class="btn btn--secondary" data-action="prev">⬅️ Previous</button>
        <button type="button" class="btn btn--primary" data-action="flip">🔄 Flip Card</button>
        <button type="button" class="btn btn--secondary" data-action="next">Next ➡️</button>
      </div>

      <footer class="module-footer">
        Module 1 · Flashcards
      </footer>
    `;
  }
}
