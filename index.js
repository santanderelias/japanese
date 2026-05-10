import { loadAndRenderCards, hideFullScreenCard, renderCardsGrid, toggleAnswer, showNextCard, showPrevCard } from './modules/renderCard.js';
import { showNotification } from './modules/notifications.js';
import { initMeaningGame } from './modules/games/meaningMatch.js';
import { initListeningGame } from './modules/games/listeningPractice.js';
import { initStatistics } from './modules/statistics.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRandomize();
    loadAndRenderCards();
    initAudioHelper();
    initNavigation();
    
    // Fetch version dynamically from SW
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
            const version = event.data;
            console.log('App loaded version:', version);
            document.getElementById('version-display').textContent = version;
        };
        navigator.serviceWorker.controller.postMessage('get-version', [messageChannel.port2]);
    }

    // Event Listeners
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('dev-reset').addEventListener('click', async () => {
        if (!confirm('This will reset ALL data, caches, and settings. Are you sure?')) return;

        // 1. Clear Storage
        localStorage.clear();
        sessionStorage.clear();

        // 2. Clear Caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // 3. Unregister Service Workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(reg => reg.unregister()));
        }

        // 4. Reload
        location.reload();
    });
    document.getElementById('back-to-home').addEventListener('click', (e) => {
        e.stopPropagation();
        hideFullScreenCard();
    });
    
    document.getElementById('next-card').addEventListener('click', (e) => {
        e.stopPropagation();
        showNextCard();
    });
    
    document.getElementById('prev-card').addEventListener('click', (e) => {
        e.stopPropagation();
        showPrevCard();
    });
    
    // Global click for toggling answer visibility
    document.getElementById('full-card-wrapper').addEventListener('click', (e) => {
        if (!e.target.closest('.nav-btn') && !e.target.closest('.audio-btn')) {
            toggleAnswer();
        }
    });

    // Search Handlers
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    
    // Log version

    searchBtn.addEventListener('click', () => {
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            searchInput.value = '';
            renderCardsGrid('');
            searchClear.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderCardsGrid(e.target.value);
        searchClear.style.display = e.target.value ? 'block' : 'none';
    });

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        renderCardsGrid('');
        searchClear.style.display = 'none';
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        const isCardOpen = document.body.classList.contains('card-open');
        if (!isCardOpen) return;

        switch(e.code) {
            case 'Space':
            case 'Enter':
                e.preventDefault();
                toggleAnswer();
                break;
            case 'ArrowRight':
                showNextCard();
                break;
            case 'ArrowLeft':
                showPrevCard();
                break;
            case 'Escape':
                hideFullScreenCard();
                break;
        }
    });

    document.getElementById('randomize-toggle').addEventListener('change', (e) => {
        localStorage.setItem('randomize', e.target.checked);
        renderCardsGrid();
    });
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

function initRandomize() {
    const isRandom = localStorage.getItem('randomize') === 'true';
    const toggle = document.getElementById('randomize-toggle');
    if (toggle) toggle.checked = isRandom;
}

function initAudioHelper() {
    let currentAudio = null;
    window.playAudio = (src) => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        currentAudio = new Audio(src);
        currentAudio.play().catch(err => console.error('Audio playback failed:', err));
    };
}

function initNavigation() {
    const views = {
        'dashboard': document.getElementById('dashboard-view'),
        'all-cards': document.getElementById('all-cards-view'),
        'meaning-game': document.getElementById('meaning-game-view'),
        'listening-game': document.getElementById('listening-game-view'),
        'statistics': document.getElementById('statistics-view')
    };

    window.navigateTo = (viewName) => {
        Object.keys(views).forEach(name => {
            if (name === viewName) {
                views[name].classList.remove('d-none');
            } else {
                views[name].classList.add('d-none');
            }
        });

        // Search container visibility
        const searchContainer = document.getElementById('search-container-top');
        if (viewName === 'all-cards') {
            searchContainer.classList.remove('d-none');
        } else {
            searchContainer.classList.add('d-none');
            // Optionally reset search when leaving
            const searchInput = document.getElementById('search-input');
            searchInput.value = '';
            renderCardsGrid('');
            searchInput.classList.remove('active');
            document.getElementById('search-clear').style.display = 'none';
        }
    };

    // Dashboard Buttons
    document.getElementById('btn-all-cards').addEventListener('click', () => navigateTo('all-cards'));
    document.getElementById('btn-meaning-game').addEventListener('click', () => {
        navigateTo('meaning-game');
        // Start meaning game will be implemented in Phase 3
        if (window.startMeaningGame) window.startMeaningGame();
    });
    document.getElementById('btn-listening-game').addEventListener('click', () => {
        navigateTo('listening-game');
        if (window.startListeningGame) window.startListeningGame();
    });
    document.getElementById('btn-statistics-top').addEventListener('click', () => {
        navigateTo('statistics');
        if (window.initStatistics) window.initStatistics();
    });

    // Back Buttons
    const backToDashboard = () => navigateTo('dashboard');
    document.getElementById('back-to-dashboard-cards').addEventListener('click', backToDashboard);
    document.getElementById('back-to-dashboard-meaning').addEventListener('click', backToDashboard);
    document.getElementById('back-to-dashboard-listening').addEventListener('click', backToDashboard);
    document.getElementById('back-to-dashboard-stats').addEventListener('click', backToDashboard);
}
