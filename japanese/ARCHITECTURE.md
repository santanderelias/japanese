# Unified Architecture Specification (v1.5)

This document defines the architectural standard for the Japanese study application, ensuring data integrity, modularity, and strict style isolation.

## 1. Data Management (Single Source of Truth)
*   **Centralized Loading:** The application must load `data.json` exactly **once** upon initialization in `index.js`.
*   **Global State:** The data is stored in `window.allCardsData`. This object serves as the single reference for all application sections, minigames, and statistics.
*   **Dependency Injection:** Minigames and UI modules **must not** perform network fetches for data. Instead, they must implement an `init(data)` method to receive the global data object upon dynamic loading.

## 2. Minigame Standardization (Native DOM Injection)
*   **Directory Structure:** All minigames are located in `/minigames/[game-name]/`.
*   **Native Mounting:** Games are injected directly into the main DOM via parent containers (e.g., `[game-name]-game-root`). Iframes are **not** used.
*   **Class-Based Lifecycle:** Each game must implement a class with:
    *   `constructor(rootId)`: Accepts the mount point.
    *   `init(data)`: Accepts the shared `window.allCardsData`.
    *   `stopGame()`: Cleans up internal intervals, audio, and event listeners when navigating away.
*   **Dynamic Loading:** The parent `index.js` manages loading the game's JS/CSS files dynamically, ensuring no overhead for unused components.

## 3. Style Isolation (Strict Namespacing)
*   **Namespace Enforcement:** All CSS rules for minigames must be prefixed with a unique game-specific namespace (e.g., `.tamagotchi_`, `.race_`, `.mm_`, `.lp_`).
*   **No Global Leakage:** Minigame styles are strictly local to their folder. Styles must never be appended to `index.css`.
*   **Theme Integration:** Minigames must support light/dark mode by responding to `data-bs-theme` changes (via `postMessage` or observer) to maintain visual consistency with the main app.

## 4. Asset Handling
*   **Absolute Pathing:** All references to assets in `data.json` must use the `/assets/` prefix.
*   **Sanitization:** The `management` tool automatically filters valid file types (`.ogg`, `.mp3`, `.png`, `.jpg`, `.svg`) during SW generation, preventing invalid file references in the Service Worker cache.
*   **Offline-First:** All game assets and logic are cached by the Service Worker, enforcing a strict cache-only policy for local playback without network dependencies.

## 5. Navigation
*   **Top-Bar Centric:** All navigation controls (Back, Search, Stats) reside in the top bar.
*   **Native Back Button:** Navigation states are tracked via `History API` (`pushState`), enabling Android/browser native back-button functionality.
