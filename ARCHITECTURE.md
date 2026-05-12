# Unified Architecture Specification

This document defines the architectural standard for the Japanese study application, ensuring data integrity, modularity, and offline reliability.

## 1. Data Management (Single Source of Truth)
*   **Centralization:** The application must load `data.json` exactly **once** during the initialization of the main document (`index.js`).
*   **Global Access:** The loaded data must be stored in a single global object (e.g., `window.appData`). No other section or minigame is permitted to perform a `fetch` for `data.json`.
*   **Dependency Injection:** Practice games and UI components will receive this data object through initialization functions (e.g., `initGame(data)`) or by direct reference to the global object.
*   **Persistence:** All performance data (SRS, stats) must be managed by `statsTracker.js` using `localStorage` as the backing store, ensuring state is shared across the entire app ecosystem.

## 2. Asset Resolution
*   **Absolute Pathing:** All asset references in `data.json` must point to `/assets/[filename]`.
*   **Consistency:** The `management` app must enforce this naming standard, and the `renderCard.js` (and game modules) must use this absolute pathing to resolve resources.
*   **Extension Enforcement:** The management tool must sanitize file uploads, ensuring MIME-type alignment (e.g., audio is always saved as `.ogg`/`.mp3`, images as `.png`/`.jpg`).

## 3. Minigame Integration (Iframe Communication)
*   **Data Passing:** Minigames inside iframes must not fetch data. The parent `index.js` must pass the necessary data to the iframe via `postMessage` immediately upon loading or theme-syncing.
*   **Isolation:** Minigames are responsible for their own internal rendering but must accept external data provided by the parent.
*   **Theme Sync:** The parent app is responsible for pushing theme changes (`postMessage`) to iframe components.

## 4. Lifecycle & Performance
*   **Initialization:** The app must render only after the single fetch operation is complete.
*   **Offline-First:** All static assets must be cached via the Service Worker using a "Cache-Only" strategy for the `/assets/` and `/minigames/` routes to eliminate network-dependency flickers.
*   **Version Control:** The version string (Single Source of Truth) is located in `version.json`. The `management` app generates `sw.js` using this version.

## 5. Navigation
*   **Top-Bar Centric:** All navigation (Back, Search, Stats) must reside in the top bar.
*   **Stateful:** The `navigateTo` function must manage history states to support native mobile hardware back-buttons.
