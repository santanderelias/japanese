document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const homeSection = document.getElementById('home-section');
    const contentSections = document.querySelectorAll('.content-section');
    const catalogItems = document.querySelectorAll('.catalog-item');
    const navBackBtn = document.getElementById('nav-back');

    // Side Menu Elements
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const menuClose = document.getElementById('menu-close');
    const menuOverlay = document.querySelector('.menu-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-nav.prev');
    const lightboxNext = document.querySelector('.lightbox-nav.next');
    const lightboxOverlay = document.querySelector('.lightbox-overlay');

    let currentImages = [];
    let currentImageIndex = 0;

    // SPA Navigation Function
    function showSection(sectionId, immediate = false) {
        const currentActive = document.querySelector('section.active');
        if (!currentActive) return;
        if (currentActive.id === sectionId) return;

        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;

        // Transitions
        if (!immediate) {
            currentActive.classList.add('fade-out');
            setTimeout(() => {
                finalizeNavigation(currentActive, targetSection, sectionId);
            }, 500);
        } else {
            finalizeNavigation(currentActive, targetSection, sectionId);
        }
    }

    function finalizeNavigation(currentActive, targetSection, sectionId) {
        currentActive.classList.remove('active', 'fade-out');
        currentActive.style.display = 'none';

        targetSection.style.display = (sectionId === 'home-section') ? 'flex' : 'block';
        targetSection.offsetHeight; // force reflow
        targetSection.classList.add('active');

        // Nav Back Button visibility
        if (sectionId === 'home-section') {
            navBackBtn.classList.add('hidden');
        } else {
            navBackBtn.classList.remove('hidden');
        }

        // Update menu active state
        menuItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });

        window.scrollTo(0, 0);
    }

    // Side Menu Logic
    function toggleMenu(open) {
        sideMenu.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', () => toggleMenu(true));
    menuClose.addEventListener('click', () => toggleMenu(false));
    menuOverlay.addEventListener('click', () => toggleMenu(false));

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            toggleMenu(false);
            showSection(sectionId);
        });
    });

    // Catalog Item Logic
    catalogItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            showSection(sectionId);
        });
    });

    navBackBtn.addEventListener('click', () => {
        showSection('home-section');
    });

    // Lightbox Logic
    function openLightbox(index, images) {
        currentImages = images;
        currentImageIndex = index;
        updateLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        if (!sideMenu.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }

    function updateLightboxImage() {
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = currentImages[currentImageIndex];
            lightboxImg.style.opacity = '1';
        }, 150);
    }

    function nextImage() {
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        updateLightboxImage();
    }

    function prevImage() {
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        updateLightboxImage();
    }

    // Attach Lightbox to Gallery Items
    function setupGalleries() {
        contentSections.forEach(section => {
            const galleryItems = section.querySelectorAll('.gallery-item');
            const images = Array.from(galleryItems).map(item => item.querySelector('img').src);

            galleryItems.forEach((item, index) => {
                // Remove existing listeners if any
                item.onclick = null;
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    openLightbox(index, images);
                });
            });
        });
    }

    setupGalleries();

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    // Keyboard Navigation for Lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    });

    // Swipe Support for Lightbox
    let touchStartX = 0;
    let touchEndX = 0;

    lightbox.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) nextImage();
        if (touchEndX > touchStartX + threshold) prevImage();
    }

    // CSS for JS transitions (simple fade for lightbox img)
    lightboxImg.style.transition = 'opacity 0.2s ease-in-out';
});
