import { createCardTemplate } from './card.js';
import { showNotification } from './notifications.js';

export async function loadAndRenderCards() {
    const container = document.getElementById('cards-container');
    if (!container) return;

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to fetch data.json');
        
        const cardsData = await response.json();
        
        container.innerHTML = cardsData.map(card => createCardTemplate(card)).join('');
        
        showNotification(`Loaded ${cardsData.length} cards successfully!`, 'success');
        
        // Add event listeners for details buttons if needed
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                showNotification(`Details for card ${id} coming soon!`, 'info');
            });
        });

    } catch (error) {
        console.error('Error rendering cards:', error);
        showNotification('Error loading cards. Please try again.', 'danger');
    }
}
