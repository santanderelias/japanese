import { createCardFrontTemplate, renderStudyView } from './card.js';
import { showNotification } from './notifications.js';

let allCardsData = [];
let currentDeck = []; // The actual ordered cards being studied
let currentIndex = -1;

// Cache DOM elements
const elements = {
    container: document.getElementById('cards-container'),
    homeSection: document.getElementById('home-section'),
    cardViewSection: document.getElementById('card-view-section'),
    studyContainer: document.getElementById('study-container'),
    answerSection: null // Will be assigned after study view render
};

export async function loadAndRenderCards() {
    if (!elements.container) return;

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to fetch data.json');
        
        allCardsData = await response.json();
        renderCardsGrid();
        
    } catch (error) {
        console.error('Error rendering cards:', error);
        showNotification('Error loading cards. Please try again.', 'danger');
    }
}

export function renderCardsGrid(filter = '') {
    if (!elements.container) return;
    
    const isRandom = localStorage.getItem('randomize') === 'true';
    const query = filter.toLowerCase();
    
    // Filter cards
    currentDeck = allCardsData.filter(card => {
        if (card.hidden) return false;
        if (!query) return true;
        
        return (
            card.kanji?.toLowerCase().includes(query) ||
            card.reading?.toLowerCase().includes(query) ||
            card.meaning?.toLowerCase().includes(query)
        );
    });
    
    if (isRandom) {
        // Fisher-Yates shuffle
        for (let i = currentDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
        }
    }
    
    const fragment = document.createDocumentFragment();
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = currentDeck.map(card => createCardFrontTemplate(card)).join('');
    
    while (tempContainer.firstChild) {
        const cardEl = tempContainer.firstChild;
        if (cardEl.nodeType === 1) { 
            cardEl.addEventListener('click', (e) => {
                const homeCard = e.currentTarget.querySelector('.card-home');
                if (!homeCard) return;
                const id = parseInt(homeCard.getAttribute('data-id'));
                const index = currentDeck.findIndex(c => c.id === id);
                if (index !== -1) showFullScreenCard(index);
            });
        }
        fragment.appendChild(cardEl);
    }
    
    elements.container.innerHTML = '';
    elements.container.appendChild(fragment);
}

export function showFullScreenCard(index) {
    if (index < 0 || index >= currentDeck.length) return;
    
    currentIndex = index;
    const cardData = currentDeck[currentIndex];
    
    // Optimized update: Only replace innerHTML if studyContainer is empty, 
    // otherwise update specific fields (optional, starting with full render for stability)
    elements.studyContainer.innerHTML = renderStudyView(cardData);
    
    // Re-cache answer section reference
    elements.answerSection = document.getElementById('answer-reveal-section');
    if (elements.answerSection) elements.answerSection.classList.add('d-none');
    
    elements.homeSection.classList.add('d-none');
    elements.cardViewSection.classList.remove('d-none');
    document.body.classList.add('card-open');

    // Preload next image
    if (currentIndex < currentDeck.length - 1) {
        const nextImg = new Image();
        nextImg.src = `assets/${currentDeck[currentIndex + 1].image}`;
    }
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
    elements.homeSection.classList.remove('d-none');
    elements.cardViewSection.classList.add('d-none');
    document.body.classList.remove('card-open');
    currentIndex = -1;
}

export function toggleAnswer() {
    if (!elements.answerSection) return;

    if (elements.answerSection.classList.contains('show')) {
        // Exiting
        elements.answerSection.classList.remove('show');
        setTimeout(() => elements.answerSection.classList.add('d-none'), 400);
    } else {
        // Appearing
        elements.answerSection.classList.remove('d-none');
        // Force reflow for animation to trigger
        elements.answerSection.offsetWidth; 
        elements.answerSection.classList.add('show');
    }
}
