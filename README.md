# Santael - Japanese Verb Mastery

**Santael** is a modern, offline-capable Progressive Web App (PWA) designed to help students master Japanese verb conjugations, particles, and sentence structures.

## 🚀 Features

*   **Training Menu**:
    *   **Verb Conjugation**: Practice the polite "Masu-form" for all verb groups.
    *   **Particle Quiz**: Test your knowledge of `wa`, `ga`, `ni`, `de`, `wo`, and more.
    *   **Sentence Builder**: Drag-and-drop words to reconstruct valid Japanese sentences.
    *   **Kanji Match**: A memory-style game to link Kanji characters with their readings.
*   **Study Materials**:
    *   Comprehensive **Grammar Guides** for conjugation rules and particles.
    *   Searchable **Vocabulary Database** with priority indicators.
*   **Gamification**: Track your learning with XP, Leveling, and Daily Streaks.
*   **PWA Support**: Fully functional offline after the first visit. Installable on mobile and desktop.
*   **Japanese Aesthetics**: A clean, focused UI inspired by traditional colors and layouts.

## 🛠️ Technology Stack

*   **Core**: Vanilla HTML5, CSS3, JavaScript (ES6 Modules).
*   **Styling**: Bootstrap 5 (Local vendor files) + Custom CSS.
*   **Architecture**: Single Page Application (SPA) with client-side routing.
*   **Data**: JSON-based content (`data.json`) for easy expansion.
*   **PWA**: Service Worker (`sw.js`) for caching and interactions.

## 📦 Installation & Usage

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/santael.git
    cd santael
    ```

2.  **Run locally**:
    Because this is an SPA using ES Modules, you need a local HTTP server.
    ```bash
    # Python 3
    python3 -m http.server 8080
    
    # or with Node.js
    npx http-server .
    ```

3.  **Open in Browser**:
    Visit `http://localhost:8080`.

## 📂 Project Structure

```
.
├── app.js            # Main application router and logic
├── data.json         # Exercises, vocabulary, and grammar guides
├── index.html        # Entry point
├── main.css          # Custom styling and variables
├── manifest.json     # PWA manifest
├── sw.js             # Service Worker for offline caching
├── vendor/           # Local dependencies (Bootstrap)
├── modules/          # (Functionality logic)
│   ├── filler.js     # Verb conjugation logic
│   ├── home.js       # Dashboard view
│   ├── kanji.js      # Kanji game logic
│   ├── learning.js   # Modal handling
│   ├── particles.js  # Particle quiz logic
│   ├── reorder.js    # Sentence builder logic
│   ├── stats.js      # XP and progress tracking
│   └── study.js      # Study materials view
└── icons/            # App icons
```

## 📝 License

This project is open-source and available for educational purposes.
エリアス
