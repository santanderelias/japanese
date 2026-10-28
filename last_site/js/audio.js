/**
 * audio.js — Audio player utility with pre-recorded MP3 playback and Web Speech API fallback.
 */

import { storage } from './storage.js';
import { DataManager } from './data.js';

export class AudioPlayer {
  constructor() {
    this.currentAudio = null;
    this.audioMap = null;
    this.mapLoaded = false;
    this.loadAudioMap();
  }

  async loadAudioMap() {
    if (this.mapLoaded) return;
    try {
      const resp = await fetch('content/audio_map.json');
      if (resp.ok) {
        this.audioMap = await resp.json();
      }
    } catch {
      this.audioMap = null;
    }
    this.mapLoaded = true;
  }

  /**
   * Compute MD5 hash in browser for text.
   */
  async md5(string) {
    return this.jsMd5(string);
  }

  jsMd5(string) {
    function k(i) {
      return Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
    }
    function r(l, s) {
      return (l << s) | (l >>> (32 - s));
    }

    const bytes = new TextEncoder().encode(string);
    const len = bytes.length;
    const numBlocks = Math.ceil((len + 9) / 64);
    const words = new Int32Array(numBlocks * 16);

    for (let i = 0; i < len; i++) {
      words[i >> 2] |= bytes[i] << ((i % 4) * 8);
    }
    words[len >> 2] |= 0x80 << ((len % 4) * 8);
    words[numBlocks * 16 - 2] = len * 8;

    let h0 = 0x67452301;
    let h1 = 0xefcdab89;
    let h2 = 0x98badcfe;
    let h3 = 0x10325476;

    const shiftTable = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];

    for (let i = 0; i < numBlocks; i++) {
      const w = words.subarray(i * 16, (i + 1) * 16);
      let a = h0, b = h1, c = h2, d = h3;

      for (let j = 0; j < 64; j++) {
        let f, g;
        if (j < 16) {
          f = (b & c) | (~b & d);
          g = j;
        } else if (j < 32) {
          f = (d & b) | (~d & c);
          g = (5 * j + 1) % 16;
        } else if (j < 48) {
          f = b ^ c ^ d;
          g = (3 * j + 5) % 16;
        } else {
          f = c ^ (b | ~d);
          g = (7 * j) % 16;
        }

        const temp = d;
        d = c;
        c = b;
        b = (b + r((a + f + k(j) + w[g]) | 0, shiftTable[j])) | 0;
        a = temp;
      }

      h0 = (h0 + a) | 0;
      h1 = (h1 + b) | 0;
      h2 = (h2 + c) | 0;
      h3 = (h3 + d) | 0;
    }

    return [h0, h1, h2, h3].map((h) => {
      return [h & 0xff, (h >>> 8) & 0xff, (h >>> 16) & 0xff, (h >>> 24) & 0xff]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }).join('');
  }

  /**
   * Play audio for Japanese text.
   * Checks audio map or falls back to Web Speech API.
   * @param {string} japaneseText
   */
  async play(japaneseText) {
    if (!japaneseText) return;

    if (!this.mapLoaded) {
      await this.loadAudioMap();
    }

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    const cleanReading = DataManager.extractKanaReading(japaneseText);

    let filename = null;
    if (this.audioMap) {
      filename = this.audioMap[japaneseText] || this.audioMap[cleanReading] || null;
    }

    if (!filename) {
      // Fallback hash check
      filename = this.jsMd5(japaneseText) + '.mp3';
    }

    const mp3Url = `content/audio/${filename}`;

    try {
      const audio = new Audio(mp3Url);
      audio.volume = storage.settings.audioVolume || 1.0;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.currentAudio = audio;
          })
          .catch(() => {
            // Pre-recorded audio file failed to play or doesn't exist, fallback to Web Speech
            this.playSpeechSynthesis(japaneseText);
          });
      }
    } catch {
      this.playSpeechSynthesis(japaneseText);
    }
  }

  playSpeechSynthesis(text) {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const reading = DataManager.extractKanaReading(text);
    const utterance = new SpeechSynthesisUtterance(reading || text);
    utterance.lang = 'ja-JP';
    utterance.rate = storage.settings.speechRate || 1.0;
    utterance.volume = storage.settings.audioVolume || 1.0;

    window.speechSynthesis.speak(utterance);
  }
}

export const audioPlayer = new AudioPlayer();
