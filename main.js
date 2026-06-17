const galleryImages = [
  'WhatsApp Image 2026-06-17 at 13.17.31.jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.33 (1).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.33 (2).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.33.jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.34 (1).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.34 (2).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.34.jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.35 (1).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.35 (2).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.35 (3).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.35.jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.36 (1).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.36 (2).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.36 (3).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.36.jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.37 (1).jpeg',
  'WhatsApp Image 2026-06-17 at 13.17.37.jpeg'
];

const galleryGrid = document.getElementById('galleryGrid');
const modalImage = document.getElementById('modalImage');
let galleryModal;

function createGalleryCard(src, index) {
  const col = document.createElement('div');
  col.className = 'col-12 col-sm-6 col-lg-4';

  const card = document.createElement('div');
  card.className = 'card gallery-card position-relative overflow-hidden';
  card.style.cursor = 'pointer';

  const image = document.createElement('img');
  image.src = `img/${encodeURI(src)}`;
  image.alt = `Furniture image ${index + 1}`;
  image.className = 'card-img-top';

  const body = document.createElement('div');
  body.className = 'card-body';
  const caption = document.createElement('p');
  caption.className = 'gallery-caption mb-0';
  caption.textContent = `Escena de Muebles ${index + 1}`;
  body.appendChild(caption);

  card.appendChild(image);
  card.appendChild(body);
  card.addEventListener('click', () => openModal(src));

  col.appendChild(card);
  return col;
}

function openModal(src) {
  modalImage.src = `img/${encodeURI(src)}`;
  modalImage.alt = src;
  if (!galleryModal) {
    galleryModal = new bootstrap.Modal(document.getElementById('galleryModal'));
  }
  galleryModal.show();
}

function loadGallery() {
  galleryImages.forEach((filename, index) => {
    galleryGrid.appendChild(createGalleryCard(filename, index));
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (event) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function closeNavbarOnSelect() {
  const navLinks = document.querySelectorAll('.navbar-collapse .nav-link');
  const navCollapse = document.querySelector('.navbar-collapse');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (navCollapse.classList.contains('show')) {
        const bsCollapse = bootstrap.Collapse.getInstance(navCollapse) || new bootstrap.Collapse(navCollapse);
        bsCollapse.hide();
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  initSmoothScroll();
  closeNavbarOnSelect();
});
