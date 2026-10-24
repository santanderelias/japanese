/**
 * Kana Chart Module (4) — Hiragana & Katakana grid reference table with audio.
 */

import { Module } from './base.js';
import { audioPlayer } from '../audio.js';

export class KanaModule extends Module {
  constructor() {
    super({
      id: 3,
      name: 'Kana Chart',
      navLabel: '仮名 (Kana)',
      navOrder: 3
    });

    this.activeTab = 'hiragana'; // 'hiragana' or 'katakana'

    this.hiraganaTable = [
      ['あ', 'い', 'う', 'え', 'お'],
      ['か', 'き', 'く', 'け', 'こ'],
      ['さ', 'し', 'す', 'せ', 'そ'],
      ['た', 'ち', 'つ', 'て', 'と'],
      ['な', 'に', 'ぬ', 'ね', 'の'],
      ['は', 'ひ', 'ふ', 'へ', 'ほ'],
      ['ま', 'み', 'む', 'め', 'も'],
      ['や', '',   'ゆ', '',   'よ'],
      ['ら', 'り', 'る', 'れ', 'ろ'],
      ['わ', '',   '',   '',   'を'],
      ['ん', '',   '',   '',   '']
    ];

    this.katakanaTable = [
      ['ア', 'イ', 'ウ', 'エ', 'オ'],
      ['カ', 'キ', 'ク', 'ケ', 'コ'],
      ['サ', 'シ', 'ス', 'セ', 'ソ'],
      ['タ', 'チ', 'ツ', 'テ', 'ト'],
      ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
      ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'],
      ['マ', 'ミ', 'ム', 'メ', 'モ'],
      ['ヤ', '',   'ユ', '',   'ヨ'],
      ['ラ', 'リ', 'ル', 'レ', 'ロ'],
      ['ワ', '',   '',   '',   'ヲ'],
      ['ン', '',   '',   '',   '']
    ];

    this.romajiTable = [
      ['a', 'i', 'u', 'e', 'o'],
      ['ka', 'ki', 'ku', 'ke', 'ko'],
      ['sa', 'shi', 'su', 'se', 'so'],
      ['ta', 'chi', 'tsu', 'te', 'to'],
      ['na', 'ni', 'nu', 'ne', 'no'],
      ['ha', 'hi', 'fu', 'he', 'ho'],
      ['ma', 'mi', 'mu', 'me', 'mo'],
      ['ya', '', 'yu', '', 'yo'],
      ['ra', 'ri', 'ru', 're', 'ro'],
      ['wa', '', '', '', 'wo'],
      ['n', '', '', '', '']
    ];
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('[data-kana-tab]');
      if (tabBtn) {
        this.activeTab = tabBtn.getAttribute('data-kana-tab');
        this.renderTable();
        return;
      }

      const kanaTile = e.target.closest('[data-kana-char]');
      if (kanaTile) {
        const char = kanaTile.getAttribute('data-kana-char');
        if (char) audioPlayer.play(char);
      }
    });
  }

  show() {
    super.show();
    this.renderTable();
  }

  renderTable() {
    if (!this.element) return;
    const root = this.element.querySelector('#kana-table-root');
    if (!root) return;

    const table = this.activeTab === 'hiragana' ? this.hiraganaTable : this.katakanaTable;

    let gridHtml = '';
    for (let r = 0; r < table.length; r++) {
      for (let c = 0; c < 5; c++) {
        const char = table[r][c];
        const romaji = this.romajiTable[r][c];

        if (!char) {
          gridHtml += `<div class="kana-grid-cell cell-empty"></div>`;
        } else {
          gridHtml += `
            <button type="button" class="kana-grid-cell" data-kana-char="${char}">
              <span class="kana-char">${char}</span>
              <span class="kana-romaji">${romaji}</span>
            </button>
          `;
        }
      }
    }

    root.innerHTML = gridHtml;

    // Toggle tab active button states
    const hBtn = this.element.querySelector('[data-kana-tab="hiragana"]');
    const kBtn = this.element.querySelector('[data-kana-tab="katakana"]');
    if (hBtn) hBtn.className = `btn ${this.activeTab === 'hiragana' ? 'btn--primary' : 'btn--secondary'}`;
    if (kBtn) kBtn.className = `btn ${this.activeTab === 'katakana' ? 'btn--primary' : 'btn--secondary'}`;
  }

  render() {
    return `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1>Kana Chart (あ・ア)</h1>
          <p>Click any Hiragana or Katakana character to listen to its pronunciation.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button type="button" class="btn btn--primary" data-kana-tab="hiragana">ひらがな (Hiragana)</button>
          <button type="button" class="btn btn--secondary" data-kana-tab="katakana">カタカナ (Katakana)</button>
        </div>
      </div>

      <div class="content-block" style="max-width:650px; margin:0 auto;">
        <div id="kana-table-root" class="kana-chart-grid">
          <!-- Rendered dynamically -->
        </div>
      </div>

      <footer class="module-footer">
        Module 3 · Kana Chart
      </footer>
    `;
  }
}
