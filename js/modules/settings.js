/**
 * Settings Module (99) — Controls theme, dataset management (JSON uploader), backup export/import, and reset.
 */

import { Module } from './base.js';
import { storage } from '../storage.js';
import { dataManager } from '../data.js';
import { showToast, showModal } from '../ui.js';

export const THEME_KEY = 'app-theme';

export function getStoredTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'dark' || t === 'light') return t;
  } catch {}
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
    storage.settings.theme = theme;
    storage.saveSettings();
  } catch {}
}

export class SettingsModule extends Module {
  constructor() {
    super({
      id: 99,
      name: 'Settings',
      navLabel: '設定',
      navOrder: 99
    });
  }

  afterMount() {
    this.element.addEventListener('click', (e) => {
      const themeBtn = e.target.closest('[data-theme-value]');
      if (themeBtn) {
        const value = themeBtn.getAttribute('data-theme-value');
        if (value === 'light' || value === 'dark') {
          applyTheme(value);
          this.syncThemeUI();
          this.showToast('theme-toast', `Theme set to ${value}.`);
        }
        return;
      }

      const furiganaBtn = e.target.closest('[data-furigana-value]');
      if (furiganaBtn) {
        const val = furiganaBtn.getAttribute('data-furigana-value');
        storage.settings.furiganaMode = val;
        storage.saveSettings();
        this.renderDatasetsAndPreferences();
        this.showToast('pref-toast', `Furigana display updated to ${val}.`);
        return;
      }

      const exportBtn = e.target.closest('#btn-export-json');
      if (exportBtn) {
        this.exportDataFile();
        return;
      }

      const resetBtn = e.target.closest('#btn-reset-progress');
      if (resetBtn) {
        showModal({
          title: 'Reset Progress',
          message: 'Are you sure you want to reset all learning progress? This cannot be undone.',
          confirmText: 'Reset Progress',
          danger: true
        }).then((confirmed) => {
          if (confirmed) {
            storage.resetAllProgress();
            showToast('All progress reset successfully.', 'success');
          }
        });
        return;
      }

      const datasetCheck = e.target.closest('[data-dataset-id]');
      if (datasetCheck) {
        const dsId = datasetCheck.getAttribute('data-dataset-id');
        const isChecked = datasetCheck.checked;
        let active = storage.settings.activeDatasetIds || ['marugoto_a1'];

        if (isChecked) {
          if (!active.includes(dsId)) active.push(dsId);
        } else {
          if (active.length === 1 && active.includes(dsId)) {
            showToast('At least one dataset must remain enabled!', 'warning');
            datasetCheck.checked = true;
            return;
          }
          active = active.filter((id) => id !== dsId);
        }

        storage.settings.activeDatasetIds = active;
        storage.saveSettings();
        showToast('Active datasets updated.', 'success');
        return;
      }

      const deleteDsBtn = e.target.closest('[data-delete-dataset]');
      if (deleteDsBtn) {
        const dsId = deleteDsBtn.getAttribute('data-delete-dataset');
        showModal({
          title: 'Remove Dataset',
          message: `Remove custom dataset "${dsId}"?`,
          confirmText: 'Remove',
          danger: true
        }).then((confirmed) => {
          if (confirmed) {
            dataManager.removeCustomDataset(dsId);
            this.renderDatasetsAndPreferences();
            showToast('Custom dataset removed.', 'success');
          }
        });
        return;
      }
    });

    const fileInput = this.element.querySelector('#import-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target.result;
          try {
            const parsed = JSON.parse(content);

            // Check if it's a vocabulary dataset or a full backup
            if (parsed.topics && Array.isArray(parsed.topics)) {
              // Vocabulary dataset JSON
              dataManager.addCustomDataset(parsed);
              this.renderDatasetsAndPreferences();
              showToast(`Vocabulary dataset "${parsed.title || 'Custom'}" imported successfully!`, 'success');
            } else if (parsed.progress || parsed.settings) {
              // Full backup JSON
              const result = storage.importAllData(content);
              if (result.success) {
                applyTheme(storage.settings.theme);
                this.syncThemeUI();
                this.renderDatasetsAndPreferences();
                showToast('Backup data imported successfully!', 'success');
              } else {
                showToast('Import failed: ' + result.error, 'error');
              }
            } else {
              showToast('Unrecognized JSON format. Must be a dataset JSON or backup JSON.', 'warning');
            }
          } catch (err) {
            showToast('Invalid JSON file: ' + err.message, 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  }

  show() {
    super.show();
    this.syncThemeUI();
    this.renderDatasetsAndPreferences();
  }

  renderDatasetsAndPreferences() {
    if (!this.element) return;
    const datasetsListEl = this.element.querySelector('#datasets-list');
    const fMode = storage.settings.furiganaMode || 'ruby';

    if (datasetsListEl) {
      const allDs = dataManager.getAllDatasets();
      const activeIds = storage.settings.activeDatasetIds || ['marugoto_a1'];

      datasetsListEl.innerHTML = allDs
        .map((ds) => {
          const isActive = activeIds.includes(ds.id);
          const isCore = ds.id === 'marugoto_a1';

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border);">
              <div>
                <strong>${ds.title}</strong> (${ds.level || 'Custom'})
                <div class="text-muted" style="font-size:0.85rem;">Topics: ${ds.topics.length}</div>
              </div>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <label style="display:flex; align-items:center; gap:0.4rem; cursor:pointer;">
                  <input type="checkbox" data-dataset-id="${ds.id}" ${isActive ? 'checked' : ''}> Active
                </label>
                ${
                  !isCore
                    ? `
                  <button type="button" class="btn btn--danger btn--sm" data-delete-dataset="${ds.id}">Delete</button>
                `
                    : ''
                }
              </div>
            </div>
          `;
        })
        .join('');
    }

    // Sync Furigana Buttons
    this.element.querySelectorAll('[data-furigana-value]').forEach((btn) => {
      const val = btn.getAttribute('data-furigana-value');
      const isSel = val === fMode;
      btn.classList.toggle('is-selected', isSel);
    });
  }

  syncThemeUI() {
    if (!this.element) return;
    const theme = getStoredTheme();
    this.element.querySelectorAll('[data-theme-value]').forEach((btn) => {
      const value = btn.getAttribute('data-theme-value');
      const selected = value === theme;
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
  }

  exportDataFile() {
    const jsonStr = storage.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japanese_app_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('storage-toast', 'Backup exported to file.');
  }

  showToast(id, message) {
    if (!this.element) return;
    const el = this.element.querySelector(`#${id}`);
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
    }, 3500);
  }

  render() {
    const theme = getStoredTheme();
    return `
      <header class="page-header">
        <h1>Settings & Data (設定)</h1>
        <p>Manage themes, vocabulary dataset JSONs, backup export/import, and learning preferences.</p>
      </header>

      <div class="settings-panel">
        <!-- Appearance -->
        <section class="settings-group">
          <h2>Appearance Theme</h2>
          <p>Choose light or dark mode.</p>
          <div class="theme-switch">
            <button type="button" class="theme-option ${theme === 'light' ? 'is-selected' : ''}" data-theme-value="light">
              ☀️ Light
            </button>
            <button type="button" class="theme-option ${theme === 'dark' ? 'is-selected' : ''}" data-theme-value="dark">
              🌙 Dark
            </button>
          </div>
          <div id="theme-toast" class="toast toast--success"></div>
        </section>

        <!-- Display Preferences -->
        <section class="settings-group">
          <h2>Display Preferences</h2>
          <p>Furigana rendering style across Flashcards and Quizzes.</p>
          <div class="theme-switch">
            <button type="button" class="theme-option" data-furigana-value="ruby">
              HTML Ruby: <ruby>学生<rt>がくせい</rt></ruby>
            </button>
            <button type="button" class="theme-option" data-furigana-value="show">
              Parentheses: 学生(がくせい)
            </button>
            <button type="button" class="theme-option" data-furigana-value="hide">
              Kanji Only: 学生
            </button>
          </div>
          <div id="pref-toast" class="toast toast--success"></div>
        </section>

        <!-- Dataset Manager -->
        <section class="settings-group">
          <h2>Vocabulary Datasets</h2>
          <p>Enable active datasets or import new JSON vocabulary files (e.g., Marugoto A2 / Genki).</p>

          <div id="datasets-list" style="margin-bottom:1rem;">
            <!-- Rendered dynamically -->
          </div>

          <div>
            <label class="btn btn--secondary btn--sm" style="cursor:pointer; display:inline-block;">
              📂 Import JSON Dataset / Backup
              <input type="file" id="import-file-input" accept=".json" style="display:none;">
            </label>
          </div>
          <div id="dataset-toast" class="toast toast--success"></div>
        </section>

        <!-- Backup & Storage -->
        <section class="settings-group">
          <h2>Data Backup & Export</h2>
          <p>Export your user progress and custom datasets to JSON, or reset all progress.</p>
          <div class="settings-actions">
            <button type="button" class="btn btn--secondary" id="btn-export-json">
              📥 Export Backup JSON
            </button>
            <button type="button" class="btn btn--danger" id="btn-reset-progress">
              ⚠️ Reset All Progress
            </button>
          </div>
          <div id="storage-toast" class="toast toast--warning"></div>
        </section>
      </div>

      <footer class="module-footer">
        Module 99 · Settings
      </footer>
    `;
  }
}
