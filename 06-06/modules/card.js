const playIcon = `
    <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M8 5v14l11-7z"/>
    </svg>
`;

export function createCardFrontTemplate(data) {
    const { id, reading, kanji, image, audio } = data;
    const displayImage = image ? `assets/${image}` : 'assets/placeholder.jpg';

    // Added loading="lazy" for the background image via a hidden img tag 
    // to hint to the browser, though CSS bg-images don't support it directly.
    // Instead, we ensure the template is clean.
    return `
        <div class="col" id="card-${id}">
            <div class="card card-home h-100 shadow-sm" style="background-image: url('${displayImage}')" data-id="${id}">
                <img src="${displayImage}" loading="lazy" style="display:none;" />
                <div class="card-overlay">
                    <div class="d-flex align-items-center mb-1">
                        <h5 class="card-title mb-0">${kanji || reading}</h5>
                        ${audio ? `
                            <button class="audio-btn ms-2" data-audio="${audio}" onclick="event.stopPropagation(); window.playAudio('assets/${audio}')">
                                ${playIcon}
                            </button>
                        ` : ''}
                    </div>
                    <div class="card-subtitle">${reading}</div>
                </div>
            </div>
        </div>
    `;
}

export function renderStudyView(data) {
    const { kanji, reading, sentence, englishSentence, image, audio, sentenceAudio, meaning } = data;
    const displayImage = image ? `assets/${image}` : 'assets/placeholder.jpg';

    return `
        <div class="study-card-wrapper" style="background-image: url('${displayImage}')">
            <!-- Hidden img for faster browser prioritization -->
            <img src="${displayImage}" style="display:none;" />

            <div class="card-content-overlay">
                <!-- Answer Section (Revealed at Top) -->
                <div id="answer-reveal-section" class="answer-section w-100 mt-4 d-none">
...
                    <div class="d-flex justify-content-center">
                        <div class="col-lg-8">
                            <div class="answer-box p-3 rounded-4 shadow-lg text-center">
                                <div class="back-meaning fw-bold mb-1 fs-4 text-white">${meaning}</div>
                                <div class="fs-6 text-info fst-italic">${englishSentence}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Question Section (Bottom-Left) -->
                <div class="question-section">
                    <div class="text-background d-flex align-items-center">
                        <h1 class="face-title mb-0 study-text-white">${kanji}</h1>
                        ${audio ? `
                            <button class="audio-btn ms-2" onclick="event.stopPropagation(); window.playAudio('assets/${audio}')">
                                ${playIcon}
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="text-background mt-2">
                        <div class="face-subtitle mb-0 study-text-white">${reading}</div>
                    </div>
                    
                    <div class="text-background mt-2 d-flex align-items-center">
                        <div class="face-sentence text-left mb-0 study-text-white">${sentence}</div>
                        ${sentenceAudio ? `
                            <button class="audio-btn ms-2" onclick="event.stopPropagation(); window.playAudio('assets/${sentenceAudio}')">
                                ${playIcon}
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}
