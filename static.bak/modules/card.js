export function createCardTemplate(data) {
    const { id, reading, kanji, audio, sentence, englishSentence, image, meaning } = data;
    
    // Fallback images if not provided
    const displayImage = image ? `assets/${image}` : 'assets/placeholder.jpg';
    const displayAudio = audio ? `assets/${audio}` : null;

    return `
        <div class="col" id="card-${id}">
            <div class="card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${displayImage}" class="card-img-top rounded-top" alt="${kanji || reading}" onerror="this.src='assets/not-found.svg'">
                    <span class="position-absolute top-0 end-0 m-2 badge rounded-pill bg-dark bg-opacity-50">
                        #${id}
                    </span>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title mb-1">
                        ${kanji} <span class="text-muted fs-6">(${reading})</span>
                    </h5>
                    <p class="card-text small text-muted mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${meaning}
                    </p>
                    
                    <div class="mt-auto">
                        <div class="sentence-box bg-body-secondary p-2 rounded mb-3">
                            <div class="fw-bold small mb-1">${sentence}</div>
                            <div class="text-muted smaller fst-italic">${englishSentence}</div>
                        </div>
                        
                        ${displayAudio ? `
                            <audio controls class="audio-player w-100 mb-2" style="height: 35px;">
                                <source src="${displayAudio}" type="audio/ogg">
                                Your browser does not support the audio element.
                            </audio>
                        ` : ''}
                        
                        <button class="btn btn-sm btn-outline-primary w-100 view-details mt-2" data-id="${id}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
