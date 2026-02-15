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
    const lightboxConsulta = document.getElementById('lightbox-consulta');

    let currentImages = [];
    let currentImageIndex = 0;
    let slideshowInterval = null;

    // --- Slideshow Logic ---
    const sectionImages = {
        'section-1': ['img/section1/sofa.jpg', 'img/section1/chair.jpg', 'img/section1/table.jpg', 'img/section1/desk.jpg', 'img/section1/bed.jpg', 'img/section1/lamp.jpg', 'img/section1/armchair.jpg', 'img/section1/interior.jpg', 'img/section1/shelf.jpg'],
        'section-2': ['img/section2/sofa.jpg', 'img/section2/chair.jpg', 'img/section2/table.jpg', 'img/section2/desk.jpg', 'img/section2/bed.jpg', 'img/section2/lamp.jpg', 'img/section2/armchair.jpg', 'img/section2/interior.jpg', 'img/section2/shelf.jpg'],
        'section-3': ['img/section3/sofa.jpg', 'img/section3/chair.jpg', 'img/section3/table.jpg', 'img/section3/desk.jpg', 'img/section3/bed.jpg', 'img/section3/lamp.jpg', 'img/section3/armchair.jpg', 'img/section3/interior.jpg', 'img/section3/shelf.jpg'],
        'section-4': ['img/section4/sofa.jpg', 'img/section4/chair.jpg', 'img/section4/table.jpg', 'img/section4/desk.jpg', 'img/section4/bed.jpg', 'img/section4/lamp.jpg', 'img/section4/armchair.jpg', 'img/section4/interior.jpg', 'img/section4/shelf.jpg']
    };

    function startHomepageSlideshow() {
        if (slideshowInterval) return;
        slideshowInterval = setInterval(() => {
            catalogItems.forEach(item => {
                const sectionId = item.getAttribute('data-section');
                const images = sectionImages[sectionId];
                if (!images) return;
                const currentImg = item.style.getPropertyValue('--bg-image').replace(/url\(['"]?|['"]?\)/g, '');
                let nextImg;
                do {
                    nextImg = images[Math.floor(Math.random() * images.length)];
                } while (nextImg === currentImg && images.length > 1);
                item.style.setProperty('--bg-image-next', `url('${nextImg}')`);
                item.classList.add('slide-transition');
                setTimeout(() => {
                    item.style.setProperty('--bg-image', `url('${nextImg}')`);
                    item.classList.remove('slide-transition');
                }, 1000);
            });
        }, 2000);
    }

    function stopHomepageSlideshow() {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }

    // SPA Navigation Function
    function showSection(sectionId, immediate = false) {
        const currentActive = document.querySelector('section.active');
        if (!currentActive) return;
        if (currentActive.id === sectionId) return;

        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;

        if (sectionId === 'home-section') {
            startHomepageSlideshow();
        } else {
            stopHomepageSlideshow();
        }

        if (!immediate) {
            currentActive.classList.add('fade-out');
            setTimeout(() => {
                finalizeNavigation(currentActive, targetSection, sectionId);
            }, 400);
        } else {
            finalizeNavigation(currentActive, targetSection, sectionId);
        }
    }

    function finalizeNavigation(currentActive, targetSection, sectionId) {
        currentActive.classList.remove('active', 'fade-out');
        currentActive.style.display = 'none';

        if (sectionId === 'home-section') {
            targetSection.style.display = 'flex';
        } else {
            targetSection.style.display = 'block';
        }

        targetSection.offsetHeight;
        targetSection.classList.add('active');

        if (sectionId === 'home-section') {
            navBackBtn.classList.add('hidden');
        } else {
            navBackBtn.classList.remove('hidden');
        }

        menuItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
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

        const imgSrc = currentImages[currentImageIndex];
        const fileNameWithExt = imgSrc.split('/').pop();
        const fileName = fileNameWithExt.substring(0, fileNameWithExt.lastIndexOf('.')) || fileNameWithExt;

        // Update WhatsApp enquiry link
        const phone = "5491153892491";
        const message = `Hola! Consulta por el articulo ${fileName}`;
        const whatsappBtn = document.getElementById('lightbox-consulta');
        if (whatsappBtn) {
            whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }

        setTimeout(() => {
            lightboxImg.src = imgSrc;
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

    // CSS for JS transitions
    lightboxImg.style.transition = 'opacity 0.2s ease-in-out';

    // Start slideshow on load
    startHomepageSlideshow();
});
