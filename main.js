document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const homeSection = document.getElementById('home-section');
    const contentSections = document.querySelectorAll('.content-section');
    const navBackBtn = document.getElementById('nav-back');
    const catalogGrid = document.getElementById('catalog-grid');
    const sideMenuNav = document.getElementById('side-menu-nav');

    // Side Menu Elements
    const menuToggle = document.getElementById('menu-toggle');
    const sideMenu = document.getElementById('side-menu');
    const menuClose = document.getElementById('menu-close');
    const menuOverlay = document.querySelector('.menu-overlay');

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

    // --- Dynamic UI Generation ---
    function generateUI() {
        const sectionsCount = CONFIG.settings?.visibleSectionsCount || 4;

        // Identify which sections to show
        const allSectionIds = Object.keys(CONFIG.sections)
            .sort((a, b) => CONFIG.sections[a].menuOrder - CONFIG.sections[b].menuOrder);

        // Product sections specifically
        const productSectionIds = allSectionIds.filter(id => !CONFIG.sections[id].isHome && !CONFIG.sections[id].isInfoPage);
        const visibleProductSectionIds = productSectionIds.slice(0, sectionsCount);

        // Final sorted sections for menu: Home + Visible Products + Info Pages
        const visibleSectionIds = allSectionIds.filter(id => {
            const section = CONFIG.sections[id];
            if (section.isHome || section.isInfoPage) return true;
            return visibleProductSectionIds.includes(id);
        });

        // Sidebar Menu
        sideMenuNav.innerHTML = ''; // Clear existing
        visibleSectionIds.forEach(sectionId => {
            const section = CONFIG.sections[sectionId];
            const menuItem = document.createElement('a');
            menuItem.href = '#';
            menuItem.className = 'menu-item';
            if (section.isHome) menuItem.classList.add('active');
            menuItem.setAttribute('data-section', sectionId);
            menuItem.textContent = section.menuTitle || section.title;
            menuItem.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMenu(false);
                showSection(sectionId);
            });
            sideMenuNav.appendChild(menuItem);
        });

        // Home Catalog Grid
        catalogGrid.innerHTML = ''; // Clear existing
        visibleProductSectionIds.forEach(sectionId => {
            const section = CONFIG.sections[sectionId];
            const item = document.createElement('div');
            item.className = 'catalog-item';
            item.setAttribute('data-section', sectionId);

            // Set initial background image
            if (section.images && section.images.length > 0) {
                item.style.setProperty('--bg-image', `url('${section.images[0].src}')`);
            }

            const overlay = document.createElement('div');
            overlay.className = 'item-overlay';
            const h3 = document.createElement('h3');
            h3.textContent = section.title;
            const p = document.createElement('p');
            p.textContent = section.description;

            overlay.appendChild(h3);
            overlay.appendChild(p);
            item.appendChild(overlay);

            item.addEventListener('click', () => showSection(sectionId));
            catalogGrid.appendChild(item);
        });

        // Populate Gallery Grids
        visibleProductSectionIds.forEach(sectionId => {
            const section = CONFIG.sections[sectionId];
            const galleryId = sectionId.split('-')[1];
            const galleryGrid = document.getElementById(`gallery-${galleryId}`);
            if (galleryGrid) {
                galleryGrid.innerHTML = '';
                section.images.forEach((imgObj, index) => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    const img = document.createElement('img');
                    img.src = imgObj.src;
                    img.alt = section.title;
                    item.appendChild(img);

                    item.addEventListener('click', (e) => {
                        e.preventDefault();
                        openLightbox(index, section.images);
                    });
                    galleryGrid.appendChild(item);
                });
            }
        });
    }

    // --- Slideshow Logic ---
    function startHomepageSlideshow() {
        if (slideshowInterval) return;
        const interval = CONFIG.settings?.slideshowInterval || 2000;
        const catalogItems = document.querySelectorAll('.catalog-item');

        slideshowInterval = setInterval(() => {
            catalogItems.forEach(item => {
                const sectionId = item.getAttribute('data-section');
                const section = CONFIG.sections[sectionId];
                if (!section || !section.images || section.images.length < 2) return;

                const images = section.images;
                const currentImg = item.style.getPropertyValue('--bg-image').replace(/url\(['"]?|['"]?\)/g, '');
                let nextImg;
                do {
                    nextImg = images[Math.floor(Math.random() * images.length)].src;
                } while (nextImg === currentImg);

                item.style.setProperty('--bg-image-next', `url('${nextImg}')`);
                item.classList.add('slide-transition');
                setTimeout(() => {
                    item.style.setProperty('--bg-image', `url('${nextImg}')`);
                    item.classList.remove('slide-transition');
                }, 1000);
            });
        }, interval);
    }

    function stopHomepageSlideshow() {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }

    // SPA Navigation
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

        targetSection.style.display = (sectionId === 'home-section') ? 'flex' : 'block';

        targetSection.offsetHeight;
        targetSection.classList.add('active');

        navBackBtn.classList.toggle('hidden', sectionId === 'home-section');

        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Menu Logic
    function toggleMenu(open) {
        sideMenu.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', () => toggleMenu(true));
    menuClose.addEventListener('click', () => toggleMenu(false));
    menuOverlay.addEventListener('click', () => toggleMenu(false));

    navBackBtn.addEventListener('click', () => showSection('home-section'));

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
        const imgData = currentImages[currentImageIndex];
        const imgSrc = imgData.src;
        const labelText = imgData.imageLabel || CONFIG.settings.defaultLabel;
        const itemId = imgData.id || 'Articulo';

        const phone = CONFIG.settings.whatsappPhone;
        const message = `Hola! Consulta por el articulo ${itemId}`;
        if (lightboxConsulta) {
            lightboxConsulta.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }

        const dimensionsLabel = document.querySelector('.lightbox-dimensions');
        if (dimensionsLabel) dimensionsLabel.textContent = labelText;

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

    // Event Listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') closeLightbox();
    });

    let touchStartX = 0;
    let touchEndX = 0;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

    function handleSwipe() {
        const threshold = 50;
        if (touchEndX < touchStartX - threshold) nextImage();
        if (touchEndX > touchStartX + threshold) prevImage();
    }

    // Init Logic
    generateUI();
    startHomepageSlideshow();
    lightboxImg.style.transition = 'opacity 0.2s ease-in-out';
});
