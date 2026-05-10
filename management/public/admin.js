let allCards = [];
let modal;
let form;
let tableBody;
let dropZone;
let imageInput;
let imagePreview;

document.addEventListener('DOMContentLoaded', () => {
    modal = new bootstrap.Modal(document.getElementById('cardModal'));
    form = document.getElementById('card-form');
    tableBody = document.getElementById('table-body');
    dropZone = document.getElementById('image-drop-zone');
    imageInput = document.getElementById('image-input');
    imagePreview = document.getElementById('image-preview');

    fetchCards();

    document.getElementById('add-card-btn').addEventListener('click', () => {
        showModal();
    });

    document.getElementById('save-card-btn').addEventListener('click', saveCard);

    // Image Upload Handlers
    dropZone.addEventListener('click', () => imageInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0], 'image');
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0], 'image');
    });

    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                handleFile(blob, 'image');
            }
        }
    });

    // Audio Handlers
    document.getElementById('audio-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0], 'audio');
    });
    document.getElementById('sentence-audio-input').addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0], 'sentenceAudio');
    });
});

async function fetchCards() {
    const res = await fetch('/api/cards');
    allCards = await res.json();
    renderTable();
}

function renderTable() {
    tableBody.innerHTML = allCards.map(card => `
        <tr class="${card.hidden ? 'hidden-row' : ''}" onclick="showModal(${card.id})">
            <td><img src="/assets/${card.image || 'placeholder.jpg'}" class="card-img-preview"></td>
            <td>${card.kanji || '-'}</td>
            <td>${card.reading}</td>
            <td>${card.meaning}</td>
        </tr>
    `).join('');
}

function showModal(id = null) {
    form.reset();
    imagePreview.classList.add('d-none');
    
    if (id) {
        const card = allCards.find(c => c.id === id);
        document.getElementById('modalTitle').textContent = 'Edit Card';
        document.getElementById('card-id').value = card.id;
        document.getElementById('form-kanji').value = card.kanji || '';
        document.getElementById('form-reading').value = card.reading;
        document.getElementById('form-romaji').value = card.romaji || '';
        document.getElementById('form-meaning').value = card.meaning;
        document.getElementById('form-sentence').value = card.sentence || '';
        document.getElementById('form-englishSentence').value = card.englishSentence || '';
        document.getElementById('form-image').value = card.image || '';
        document.getElementById('form-audio').value = card.audio || '';
        document.getElementById('form-audio-url').value = '';
        document.getElementById('form-sentenceAudio').value = card.sentenceAudio || '';
        document.getElementById('form-sentenceAudio-url').value = '';
        document.getElementById('form-hidden').checked = card.hidden || false;
        
        if (card.image) {
            imagePreview.src = `/assets/${card.image}`;
            imagePreview.classList.remove('d-none');
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add New Card';
        document.getElementById('card-id').value = '';
        document.getElementById('form-audio').value = '';
        document.getElementById('form-audio-url').value = '';
        document.getElementById('form-sentenceAudio').value = '';
        document.getElementById('form-sentenceAudio-url').value = '';
        document.getElementById('form-hidden').checked = false;
    }
    modal.show();
}

// Add event listeners for TTS buttons
document.getElementById('tts-audio-btn').addEventListener('click', () => generateTTS('audio', document.getElementById('form-kanji').value));
document.getElementById('tts-sentenceAudio-btn').addEventListener('click', () => generateTTS('sentenceAudio', document.getElementById('form-sentence').value));

async function generateTTS(type, text) {
    if (!text) return alert('Enter text first');
    const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const result = await res.json();
    if (result.filename) document.getElementById(`form-${type}`).value = result.filename;
}

async function handleFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    
    const result = await res.json();
    if (result.filename) {
        document.getElementById(`form-${type}`).value = result.filename;
        if (type === 'image') {
            imagePreview.src = `/assets/${result.filename}`;
            imagePreview.classList.remove('d-none');
        }
    }
}

async function saveCard() {
    const id = document.getElementById('card-id').value;
    
    // Determine audio values: prefer uploaded/hidden field, fallback to URL input
    const audio = document.getElementById('form-audio').value || document.getElementById('form-audio-url').value;
    const sentenceAudio = document.getElementById('form-sentenceAudio').value || document.getElementById('form-sentenceAudio-url').value;

    const cardData = {
        id: id ? parseInt(id) : (allCards.length ? Math.max(...allCards.map(c => c.id)) + 1 : 1),
        kanji: document.getElementById('form-kanji').value,
        reading: document.getElementById('form-reading').value,
        meaning: document.getElementById('form-meaning').value,
        romaji: document.getElementById('form-romaji').value,
        sentence: document.getElementById('form-sentence').value,
        englishSentence: document.getElementById('form-englishSentence').value,
        image: document.getElementById('form-image').value,
        audio: audio,
        sentenceAudio: sentenceAudio,
        hidden: document.getElementById('form-hidden').checked
    };

    if (id) {
        const index = allCards.findIndex(c => c.id === parseInt(id));
        allCards[index] = { ...allCards[index], ...cardData };
    } else {
        allCards.push(cardData);
    }

    await syncData();
    modal.hide();
}

async function syncData() {
    await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allCards)
    });
    renderTable();
}
