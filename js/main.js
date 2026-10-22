/**
 * App entry — wires orchestrator, navbar, and page modules.
 */

import { orchestrator } from './orchestrator.js';
import { NavbarModule } from './modules/navbar.js';
import { HomeModule } from './modules/home.js';
import { Section1Module } from './modules/section1.js';
import { Section2Module } from './modules/section2/index.js';
import { SettingsModule, applyTheme, getStoredTheme } from './modules/settings.js';

async function boot() {
  // Ensure theme is applied (inline script in HTML already did first paint)
  applyTheme(getStoredTheme());

  const navbarRoot = document.getElementById('navbar-root');
  const moduleRoot = document.getElementById('module-root');

  if (!navbarRoot || !moduleRoot) {
    console.error('App roots missing from DOM.');
    return;
  }

  orchestrator.init(moduleRoot);

  // Register page modules (0, 1, 2, 99) — await so submodule packages finish load()
  await orchestrator.register(new HomeModule(orchestrator));
  await orchestrator.register(new Section1Module());
  await orchestrator.register(new Section2Module());
  await orchestrator.register(new SettingsModule());

  // Navbar is not a page module; it always stays mounted
  const navbar = new NavbarModule(orchestrator);
  navbar.mount(navbarRoot);

  // Show last module or Home
  orchestrator.showDefault();
      document.querySelector('#load-japanese').addEventListener('click', () => {
    
    loadMarugotoData().then(data => {
      const card = getRandomFlashcard(data);
      document.querySelector('#card1-subtopic').textContent = card.subtopic_ja;
      document.querySelector('#card1-title').textContent = card.japanese;
      document.querySelector('#card1-description').textContent = card.english;
    });

    loadMarugotoData().then(data => {
      const card = getRandomFlashcard(data);
      document.querySelector('#card2-subtopic').textContent = card.subtopic_ja;
      document.querySelector('#card2-title').textContent = card.japanese;
      document.querySelector('#card2-description').textContent = card.english;
    });
    loadMarugotoData().then(data => {
      const card = getRandomFlashcard(data);
      document.querySelector('#card3-subtopic').textContent = card.subtopic_ja;
      document.querySelector('#card3-title').textContent = card.japanese;
      document.querySelector('#card3-description').textContent = card.english;
    });

    })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch((err) => console.error('Boot failed:', err));
  });
} else {
  boot().catch((err) => console.error('Boot failed:', err));
}
async function loadMarugotoData() {
  const response = await fetch('/content/marugoto_a1_vocabulary.json');
  const data = await response.json();
  
  //console.log(`Loaded ${data.topics.length} topics from ${data.title}`);
  return data;
}
// Function to get a random flashcard including its parent subtopic & topic info
function getRandomFlashcard(data) {
  // Flatten all words while attaching their parent subtopic and topic information
  const allWords = data.topics.flatMap(topic => 
    topic.subtopics.flatMap(sub => 
      sub.words.map(word => ({
        ...word,
        subtopic_ja: sub.subtopic_ja,
        subtopic_en: sub.subtopic_en,
        topic_ja: topic.topic_ja,
        topic_en: topic.topic_en
      }))
    )
  );
  
  const randomIndex = Math.floor(Math.random() * allWords.length);
  return allWords[randomIndex];
}

// Example usage
