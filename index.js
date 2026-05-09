import { loadAndRenderCards, hideFullScreenCard, renderCardsGrid, toggleAnswer, showNextCard, showPrevCard } from './modules/renderCard.js';
import { showNotification } from './modules/notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initRandomize();
    loadAndRenderCards();
    initAudioHelper();

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
