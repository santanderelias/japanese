// Product Data from datos.txt
const products = [
    {
        id: 'model-45-funcional',
        name: 'Modelo 45 cm – Funcional',
        height: '45 cm',
        tag: 'Más Popular',
        features: [
            '4 cajones laterales (2 de cada lado)',
            '2 zapateros frontales',
            '1 baulera central',
            'Optimización ideal del espacio'
        ],
        description: 'El equilibrio perfecto entre altura y capacidad de guardado.',
        image: 'img/038.jpeg'
    },
    {
        id: 'model-35-compacto',
        name: 'Modelo 35 cm – Compacto',
        height: '35 cm',
        tag: 'Compacto',
        features: [
            '6 cajones en total',
            '2 cajones por lateral',
            '2 cajones frontales',
            'Altura reducida para mayor comodidad'
        ],
        description: 'Diseño compacto sin sacrificar organización.',
        image: 'img/042.jpeg'
    },
    {
        id: 'model-45-max',
        name: 'Modelo 45 cm – Máxima Capacidad',
        height: '45 cm',
        tag: 'Máxima Capacidad',
        features: [
            '8 cajones laterales (4 por lado)',
            '2 zapateros frontales',
            'Espacio de guardado superior',
            'Zapateros reemplazables por cajones'
        ],
        description: 'La solución definitiva para maximizar el almacenamiento en tu dormitorio.',
        image: 'img/051.jpeg'
    }
];

const dimensions = [
    { label: '1 Plaza', size: '0.80 x 1.90' },
    { label: '1 Plaza y Media', size: '0.90 x 1.90' },
    { label: '1 Plaza y Media', size: '1.00 x 1.90' },
    { label: 'Twin', size: '1.20 x 1.90' },
    { label: '2 Plazas', size: '1.40 x 1.90' },
    { label: 'Queen', size: '1.50 x 1.90' },
    { label: 'Queen Full', size: '1.60 x 1.90' },
    { label: 'King', size: '1.60 x 2.00' },
    { label: 'King Size', size: '1.80 x 2.00' },
    { label: 'Super King', size: '2.00 x 2.00' },
    { label: 'Super King Full', size: '2.00 x 2.15' }
];

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderDimensions();
    setupScrollAnimations();
});

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = products.map(product => `
        <div class="product-card reveal" onclick="openLightbox('${product.image}')">
            <div style="height: 300px; overflow: hidden;">
                <img src="${product.image}" alt="${product.name}" class="product-image">
            </div>
            <div class="product-info">
                <span class="badge">${product.tag}</span>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p><strong>Altura:</strong> ${product.height}</p>
                <ul class="feature-list">
                    ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');
}

function renderDimensions() {
    const grid = document.getElementById('dimensions-grid');
    if (!grid) return;

    grid.innerHTML = dimensions.map(dim => `
        <div class="dimension-item reveal">
            <div class="dimension-value">${dim.size}</div>
            <div style="font-size: 0.9rem; color: var(--secondary-color); margin-top: 5px;">${dim.label}</div>
        </div>
    `).join('');
}

function setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Lightbox Logic
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.lightbox-close');
const overlay = document.querySelector('.lightbox-overlay');

function openLightbox(imageSrc) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = imageSrc;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    setTimeout(() => {
        if (lightboxImg) lightboxImg.src = '';
    }, 300); // Wait for fade out
    document.body.style.overflow = '';
}

// Event Listeners for Lightbox
if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
if (overlay) overlay.addEventListener('click', closeLightbox);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
        closeLightbox();
    }
});
