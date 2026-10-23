/**
 * App entry point — wires data manager, orchestrator, navbar, and page modules.
 */

import { orchestrator } from './orchestrator.js';
import { NavbarModule } from './modules/navbar.js';
import { HomeModule } from './modules/home.js';
import { FlashcardModule } from './modules/flashcards.js';
import { QuizModule } from './modules/quiz.js';
import { MinigameModule } from './modules/minigames.js';
import { KanaModule } from './modules/kana.js';
import { SettingsModule, applyTheme, getStoredTheme } from './modules/settings.js';
import { dataManager } from './data.js';

async function boot() {
  // Ensure theme is applied from storage or system preference
  applyTheme(getStoredTheme());

  const navbarRoot = document.getElementById('navbar-root');
  const moduleRoot = document.getElementById('module-root');

  if (!navbarRoot || !moduleRoot) {
    console.error('App root elements missing from DOM.');
    return;
  }

  // Initialize data manager and datasets
  await dataManager.init();

  orchestrator.init(moduleRoot);

  // Register Japanese Learning Modules (0=Home, 1=Flashcards, 2=Quiz, 3=Minigames, 4=Kana, 99=Settings)
  await orchestrator.register(new HomeModule(orchestrator));
  await orchestrator.register(new FlashcardModule());
  await orchestrator.register(new QuizModule());
  await orchestrator.register(new MinigameModule());
  await orchestrator.register(new KanaModule());
  await orchestrator.register(new SettingsModule());

  // Mount navbar navigation shell
  const navbar = new NavbarModule(orchestrator);
  navbar.mount(navbarRoot);

  // Show last visited module or default to Home (0)
  orchestrator.showDefault();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((err) => console.error('Boot failed:', err));
  });
} else {
  boot().catch((err) => console.error('Boot failed:', err));
}
