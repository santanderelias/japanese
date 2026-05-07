import { createCardFrontTemplate, renderStudyView } from './card.js';
import { showNotification } from './notifications.js';

let allCardsData = [];
let currentDeck = []; // The actual ordered cards being studied
let currentIndex = -1;

export async function loadAndRenderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    try {
        const response = await fetch(`data.json?v=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch data.json');
        
        allCardsData = await response.json();
        
        renderCardsGrid();
        
    } catch (error) {
        console.error('Error rendering cards:', error);
        showNotification('Error loading cards. Please try again.', 'danger');
    }
}

export function renderCardsGrid() {
    const container = document.getElementById('cards-container');
    const isRandom = localStorage.getItem('randomize') === 'true';
    
    currentDeck = [...allCardsData];
    if (isRandom) {
        currentDeck = currentDeck.sort(() => Math.random() - 0.5);
    }
    
    container.innerHTML = currentDeck.map(card => createCardFrontTemplate(card)).join('');
    
    // Add event listeners for the cards on home
    document.querySelectorAll('.card-home').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const id = parseInt(cardEl.getAttribute('data-id'));
            const index = currentDeck.findIndex(c => c.id === id);
            if (index !== -1) {
                showFullScreenCard(index);
            }
        });
    });
}

export function showFullScreenCard(index) {
    if (index < 0 || index >= currentDeck.length) return;
    
    currentIndex = index;
    const cardData = currentDeck[currentIndex];
    const homeSection = document.getElementById('home-section');
    const cardViewSection = document.getElementById('card-view-section');
    const container = document.getElementById('study-container');
    
    // Render the single study view
    container.innerHTML = renderStudyView(cardData);
    
    // Ensure hidden initially
    document.getElementById('answer-reveal-section').classList.add('d-none');
    
    homeSection.classList.add('d-none');
    cardViewSection.classList.remove('d-none');
    document.body.classList.add('card-open');
}

export function showNextCard() {
    if (currentIndex < currentDeck.length - 1) {
        showFullScreenCard(currentIndex + 1);
    } else {
        showNotification('End of deck!', 'info');
    }
}

export function showPrevCard() {
    if (currentIndex > 0) {
        showFullScreenCard(currentIndex - 1);
    }
}

export function hideFullScreenCard() {
    const homeSection = document.getElementById('home-section');
    const cardViewSection = document.getElementById('card-view-section');
    
    homeSection.classList.remove('d-none');
    cardViewSection.classList.add('d-none');
    document.body.classList.remove('card-open');
    currentIndex = -1;
}

export function toggleAnswer() {
    const section = document.getElementById('answer-reveal-section');
    if (!section) return;

    if (section.classList.contains('show')) {
        // Exiting
        section.classList.remove('show');
        setTimeout(() => section.classList.add('d-none'), 400);
    } else {
        // Appearing
        section.classList.remove('d-none');
        // Force reflow for animation to trigger
        section.offsetWidth; 
        section.classList.add('show');
    }
}
