/**
 * data.js — Central dataset manager for loading, registering, and querying Japanese vocabulary.
 */

import { storage } from './storage.js';

export class DataManager {
  constructor() {
    /** @type {Map<string, { id: string, title: string, level: string, topics: Array }>} */
    this.datasets = new Map();
    this.isLoaded = false;
  }

  async init() {
    if (this.isLoaded) return;

    // Load default dataset
    try {
      const resp = await fetch('/content/marugoto_a1_vocabulary.json');
      if (resp.ok) {
        const data = await resp.json();
        this.datasets.set('marugoto_a1', {
          id: 'marugoto_a1',
          title: data.title || 'Marugoto A1',
          level: data.level || 'A1',
          topics: data.topics || []
        });
      }
    } catch (e) {
      console.error('Failed to load marugoto_a1_vocabulary.json', e);
    }

    // Load custom datasets from storage
    const customList = storage.customDatasets || [];
    for (const c of customList) {
      if (c && c.id && c.topics) {
        this.datasets.set(c.id, c);
      }
    }

    this.isLoaded = true;
  }

  addCustomDataset(dataset) {
    if (!dataset.id) {
      dataset.id = 'custom_' + Date.now();
    }
    this.datasets.set(dataset.id, dataset);
    const existing = storage.customDatasets || [];
    const updated = existing.filter((d) => d.id !== dataset.id);
    updated.push(dataset);
    storage.saveCustomDatasets(updated);

    // Auto-enable newly added dataset in settings
    if (!storage.settings.activeDatasetIds.includes(dataset.id)) {
      storage.settings.activeDatasetIds.push(dataset.id);
      storage.saveSettings();
    }
  }

  removeCustomDataset(id) {
    if (id === 'marugoto_a1') return; // Cannot delete core dataset
    this.datasets.delete(id);
    const existing = storage.customDatasets || [];
    const updated = existing.filter((d) => d.id !== id);
    storage.saveCustomDatasets(updated);

    storage.settings.activeDatasetIds = storage.settings.activeDatasetIds.filter((d) => d !== id);
    storage.saveSettings();
  }

  getAllDatasets() {
    return Array.from(this.datasets.values());
  }

  getActiveDatasets() {
    const activeIds = storage.settings.activeDatasetIds || ['marugoto_a1'];
    return this.getAllDatasets().filter((d) => activeIds.includes(d.id));
  }

  /**
   * Get all topic metadata from active datasets.
   * @returns {Array<{ datasetId: string, topic_id: number, topic_ja: string, topic_en: string, subtopics: Array }>}
   */
  getAllTopics() {
    const active = this.getActiveDatasets();
    const topics = [];
    for (const ds of active) {
      for (const t of ds.topics) {
        topics.push({
          datasetId: ds.id,
          ...t
        });
      }
    }
    return topics;
  }

  /**
   * Get filtered list of vocabulary words based on current topic settings or passed filters.
   * Attach metadata (topic_ja, topic_en, subtopic_ja, subtopic_en, datasetId).
   */
  getWords(options = {}) {
    const { topicIds = null, onlyNeedsReview = false, onlyMastered = false } = options;
    const activeTopics = this.getAllTopics();
    const selectedTopicIds = topicIds || storage.settings.selectedTopics || [];

    const words = [];

    for (const top of activeTopics) {
      // Check if topic is selected (if selectedTopicIds is non-empty)
      const topicKey = `${top.datasetId}_${top.topic_id}`;
      if (selectedTopicIds.length > 0 && !selectedTopicIds.includes(topicKey) && !selectedTopicIds.includes(top.topic_id)) {
        continue;
      }

      for (const sub of top.subtopics || []) {
        for (const w of sub.words || []) {
          const isMastered = storage.isWordMastered(w.japanese);
          const needsReview = storage.isNeedsReview(w.japanese);

          if (onlyNeedsReview && !needsReview) continue;
          if (onlyMastered && !isMastered) continue;

          words.push({
            ...w,
            datasetId: top.datasetId,
            topic_id: top.topic_id,
            topic_ja: top.topic_ja,
            topic_en: top.topic_en,
            subtopic_ja: sub.subtopic_ja,
            subtopic_en: sub.subtopic_en,
            isMastered,
            needsReview
          });
        }
      }
    }

    return words;
  }

  /**
   * Utility to extract kana reading from parenthesized Japanese text.
   * E.g. "学生(がくせい)" -> "がくせい"
   * "学校(がっこう)" -> "がっこう"
   * "クラス / レッスン" -> "クラス"
   */
  static extractKanaReading(text) {
    if (!text) return '';
    let cleaned = text;

    // Check parenthesized readings
    cleaned = cleaned.replace(/[\u4e00-\u9faf\u3400-\u4dbf]+\(([^)]+)\)/g, '$1');
    cleaned = cleaned.replace(/[\u4e00-\u9faf\u3400-\u4dbf]+（([^）]+)）/g, '$1');

    if (cleaned.includes('/')) {
      cleaned = cleaned.split('/')[0].strip ? cleaned.split('/')[0].strip() : cleaned.split('/')[0].trim();
    }
    return cleaned.trim();
  }

  /**
   * Format display Japanese text.
   * Can split into kanji / furigana or clean string.
   */
  static formatJapaneseDisplay(text, furiganaMode = 'show') {
    if (!text) return '';
    if (furiganaMode === 'hide') {
      // Remove furigana in parentheses
      return text.replace(/\([^)]+\)/g, '').replace(/（[^）]+）/g, '').trim();
    }

    if (furiganaMode === 'ruby') {
      // Convert Kanji(furigana) to HTML <ruby>Kanji<rt>furigana</rt></ruby>
      return text.replace(/([\u4e00-\u9faf\u3400-\u4dbf]+)[\(（]([^\)）]+)[\)）]/g, '<ruby>$1<rt>$2</rt></ruby>');
    }

    // Default 'show' retains standard parentheses display
    return text;
  }
}

export const dataManager = new DataManager();
