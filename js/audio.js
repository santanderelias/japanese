/**
 * audio.js — Audio player utility with pre-recorded MP3 playback and Web Speech API fallback.
 */

import { storage } from './storage.js';
import { DataManager } from './data.js';

export class AudioPlayer {
  constructor() {
    this.currentAudio = null;
  }

  /**
   * Compute MD5 hash in browser for text.
   */
  async md5(string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string);
    // Use standard crypto API if available, else simple fallback hash array
    if (window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      // Wait, python used MD5 hash. Let's build pure JS MD5 function or compute filename.
    }
    return this.jsMd5(string);
  }

  jsMd5(string) {
    // Standard JS MD5 implementation
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];

      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17,  606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12,  1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7,  1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7,  1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22,  1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14,  643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9,  38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5,  568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20,  1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14,  1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16,  1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11,  1272893353);
      c = hh(c, d, a, b, k[7], 16, -1554976322);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4,  681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23,  76029189);
      a = hh(a, b, c, d, k[9], 4, -640364409);
      d = hh(d, a, b, c, k[12], 11, -32118308);
      c = hh(c, d, a, b, k[15], 16,  1814584777);
      b = hh(b, c, d, a, k[2], 23, -800821043);

      a = ii(a, b, c, d, k[0], 6, -145523070);
      d = ii(d, a, b, c, k[7], 10, -1120210379);
      c = ii(c, d, a, b, k[14], 15,  718787259);
      b = ii(b, c, d, a, k[5], 21, -343485551);
      a = ii(a, b, c, d, k[12], 6, -408351680);
      d = ii(d, a, b, c, k[3], 10,  116418474);
      c = ii(c, d, a, b, k[10], 15, -1214865568);
      b = ii(b, c, d, a, k[1], 21, -35309556);
      a = ii(a, b, c, d, k[8], 6,  1774184191);
      d = ii(d, a, b, c, k[15], 10, -1958414417);
      c = ii(c, d, a, b, k[6], 15, -42063);
      b = ii(b, c, d, a, k[13], 21, -1990404162);
      a = ii(a, b, c, d, k[4], 6,  1804603682);
      d = ii(d, a, b, c, k[11], 10, -40341101);
      c = ii(c, d, a, b, k[2], 15, -1502002290);
      b = ii(b, c, d, a, k[9], 21,  1236535329);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }

    function cmn(q, a, b, x, s, t) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

    function md51(s) {
      var n = s.length,
          state = [1732584193, -271733879, -1732584194, 271733878], i;
      for (i = 64; i <= s.length; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
      for (i = 0; i < s.length; i++)
        tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
      tail[i >> 2] |= 0x80 << ((i % 4) << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i++) tail[i] = 0;
      }
      tail[14] = n * 8;
      md5cycle(state, tail);
      return state;
    }

    function md5blk(s) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i)
          + (s.charCodeAt(i + 1) << 8)
          + (s.charCodeAt(i + 2) << 16)
          + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }

    var hex_chr = '0123456789abcdef'.split('');

    function rhex(n) {
      var s = '', j = 0;
      for (; j < 4; j++)
        s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
      return s;
    }

    function hex(x) {
      for (var i = 0; i < x.length; i++)
        x[i] = rhex(x[i]);
      return x.join('');
    }

    function add32(a, b) {
      return (a + b) & 0xFFFFFFFF;
    }

    // Convert string to UTF-8
    var utf8Str = unescape(encodeURIComponent(string));
    return hex(md51(utf8Str));
  }

  /**
   * Play audio for Japanese text.
   * First tries local MP3 in content/audio/{md5}.mp3, falls back to Web Speech API.
   * @param {string} japaneseText
   */
  async play(japaneseText) {
    if (!japaneseText) return;

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    const filename = this.jsMd5(japaneseText) + '.mp3';
    const mp3Url = `/content/audio/${filename}`;

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
