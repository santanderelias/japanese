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

    // Search Elements
    const searchToggle = document.getElementById('search-toggle');
    const searchOverlay = document.getElementById('search-overlay');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const searchNoResults = document.getElementById('search-no-results');

    let currentImages = [];
    let currentImageIndex = 0;
    let slideshowInterval = null;

    // --- Dynamic UI Generation ---
    let settingsUnlocked = false;
    let logoClickCount = 0;

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
            addMenuItem(sectionId, section.menuTitle || section.title, section.isHome);
        });

        // Add Settings if unlocked
        if (settingsUnlocked) {
            addMenuItem('settings-link', 'Configuración', false, () => {
                toggleMenu(false);
                openSettingsModal();
            });
        }

        // Home Catalog Grid
        catalogGrid.innerHTML = ''; // Clear existing
        catalogGrid.style.setProperty('--visible-count', visibleProductSectionIds.length);

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

    function addMenuItem(id, label, isActive, customHandler = null) {
        const menuItem = document.createElement('a');
        menuItem.href = '#';
        menuItem.className = 'menu-item';
        if (isActive) menuItem.classList.add('active');
        menuItem.setAttribute('data-section', id);
        menuItem.textContent = label;
        menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            if (customHandler) {
                customHandler();
            } else {
                toggleMenu(false);
                showSection(id);
            }
        });
        sideMenuNav.appendChild(menuItem);
    }

    // Settings Modal Logic
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const downloadBtn = document.getElementById('download-backup-btn');
    const resetBtn = document.getElementById('reset-app-btn');
    const logoElement = document.querySelector('.logo');

    // Dev Image Selection Elements
    const devToolsContainer = document.getElementById('lightbox-dev-tools');
    const devMarkCheckbox = document.getElementById('dev-mark-img');
    const devNotesInput = document.getElementById('dev-img-notes');

    // Persistence: Initial load
    let markedImages = JSON.parse(localStorage.getItem('santael_dev_notes') || '{}');
    settingsUnlocked = localStorage.getItem('santael_dev_unlocked') === 'true';

    function saveToPersistence() {
        localStorage.setItem('santael_dev_notes', JSON.stringify(markedImages));
        localStorage.setItem('santael_dev_unlocked', settingsUnlocked);
    }

    // Startup Notification
    if (settingsUnlocked) {
        setTimeout(() => {
            showToast("Modo desarrollador activo. Puedes resetear o descargar notas en 'Menú > Configuración'");
        }, 1000); // Small delay to let the app settle
    }

    function openSettingsModal() {
        settingsModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSettingsModal() {
        settingsModal.classList.remove('active');
        if (!sideMenu.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }

    function downloadBackup() {
        const reportData = Object.values(markedImages);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "reporte.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        // Start countdown for reset
        let countdown = 5;
        const interval = setInterval(() => {
            showToast(`Descarga de notas iniciada, la app volverá a sus funciones originales en ${countdown}...`);
            countdown--;
            if (countdown < 0) {
                clearInterval(interval);
                localStorage.removeItem('santael_dev_notes');
                localStorage.removeItem('santael_dev_unlocked');
                location.reload();
            }
        }, 1000);
    }

    function resetApp() {
        settingsUnlocked = false;
        markedImages = {};
        saveToPersistence();
        closeSettingsModal();
        generateUI();
        showSection('home-section', true);
    }

    logoElement.addEventListener('click', () => {
        logoClickCount++;
        if (logoClickCount === 7) {
            settingsUnlocked = true;
            saveToPersistence();
            generateUI();
            logoClickCount = 0;
            showToast("Modo desarrollador activado");
        }
    });

    settingsCloseBtn.addEventListener('click', closeSettingsModal);
    downloadBtn.addEventListener('click', downloadBackup);
    resetBtn.addEventListener('click', resetApp);

    function showToast(message) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.offsetHeight; // force reflow
        toast.classList.add('show');

        // Only auto-hide if it's not a countdown toast (which updates every second)
        if (!message.includes('originales en')) {
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }

    // Dev Selection Events
    devMarkCheckbox.addEventListener('change', () => {
        const imgData = currentImages[currentImageIndex];
        if (devMarkCheckbox.checked) {
            const noteValue = devNotesInput.value.trim();
            markedImages[imgData.id] = {
                img: imgData,
                notas: noteValue || "sin notas"
            };
            devNotesInput.focus();
        } else {
            delete markedImages[imgData.id];
        }
        saveToPersistence();
    });

    devNotesInput.addEventListener('input', () => {
        const imgData = currentImages[currentImageIndex];
        const noteValue = devNotesInput.value.trim();

        // Auto-check logic
        if (!devMarkCheckbox.checked && noteValue.length > 0) {
            devMarkCheckbox.checked = true;
        }

        if (devMarkCheckbox.checked) {
            markedImages[imgData.id] = {
                img: imgData,
                notas: noteValue || "sin notas"
            };
            saveToPersistence();
        }
    });

    devNotesInput.addEventListener('blur', () => {
        if (devMarkCheckbox.checked) {
            showToast("Nota guardada. Exporta todas las notas en 'Menu > Configuración'");
        }
    });

    devNotesInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            devNotesInput.blur();
        }
    });

    // --- Slideshow Logic ---
    function startHomepageSlideshow() {
        if (slideshowInterval) return;
        const interval = CONFIG.settings?.slideshowInterval || 2000;
        const mode = CONFIG.settings?.slideshowMode || 'sync';
        const catalogItems = document.querySelectorAll('.catalog-item');
        let currentSequenceIndex = 0;

        slideshowInterval = setInterval(() => {
            if (mode === 'sequence') {
                rotateItem(catalogItems[currentSequenceIndex]);
                currentSequenceIndex = (currentSequenceIndex + 1) % catalogItems.length;
            } else {
                catalogItems.forEach(item => rotateItem(item));
            }
        }, interval);
    }

    function rotateItem(item) {
        if (!item) return;
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
            // Place target section underneath current section for a true cross-fade
            targetSection.style.position = 'absolute';
            targetSection.style.top = '0';
            targetSection.style.left = '0';
            targetSection.style.width = '100%';
            targetSection.style.display = (sectionId === 'home-section') ? 'flex' : 'block';
            targetSection.style.opacity = '1';
            targetSection.style.zIndex = '1';

            currentActive.style.position = 'relative';
            currentActive.style.zIndex = '2';
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
        currentActive.style.position = '';
        currentActive.style.zIndex = '';

        targetSection.style.display = (sectionId === 'home-section') ? 'flex' : 'block';
        targetSection.style.position = '';
        targetSection.style.top = '';
        targetSection.style.left = '';
        targetSection.style.width = '';
        targetSection.style.opacity = '';
        targetSection.style.zIndex = '';
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
        const labels = imgData.imageLabels || CONFIG.settings.defaultLabels || [];
        const itemId = imgData.id || 'Articulo';

        const phone = CONFIG.settings.whatsappPhone;
        const message = `Hola! Consulta por el articulo ${itemId}`;
        if (lightboxConsulta) {
            lightboxConsulta.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        }

        const dimensionsLabel = document.querySelector('.lightbox-dimensions');
        if (dimensionsLabel) {
            dimensionsLabel.innerHTML = '';
            const labelsArray = Array.isArray(labels) ? labels : [labels];
            labelsArray.forEach(text => {
                const div = document.createElement('div');
                div.textContent = text;
                dimensionsLabel.appendChild(div);
            });
        }

        // Dev Mode Updates
        if (settingsUnlocked && devToolsContainer) {
            devToolsContainer.style.display = 'flex';
            const savedData = markedImages[imgData.id];
            devMarkCheckbox.checked = !!savedData;
            devNotesInput.value = savedData ? savedData.notas : '';
        } else if (devToolsContainer) {
            devToolsContainer.style.display = 'none';
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

    function handleCopy() {
        const targetId = this.getAttribute('data-copy');
        const targetElement = document.getElementById(targetId);
        const btn = this;
        const originalIcon = btn.innerHTML;

        if (targetElement) {
            const textToCopy = (targetElement.innerText || targetElement.textContent).trim();

            const finalizeCopy = () => {
                btn.classList.add('copied');
                btn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                btn.blur();

                setTimeout(() => {
                    btn.classList.remove('copied');
                    btn.innerHTML = originalIcon;
                }, 2000);
            };

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy)
                    .then(finalizeCopy)
                    .catch(() => fallbackCopy(textToCopy, finalizeCopy));
            } else {
                fallbackCopy(textToCopy, finalizeCopy);
            }
        }
    }

    function fallbackCopy(text, callback) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        // Ensure textarea is not visible but reachable
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            const successful = document.execCommand('copy');
            if (successful) callback();
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    }

    // Event Listeners
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
    lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', handleCopy);
    });

    // Search Feature Logic
    function toggleSearch(open) {
        searchOverlay.classList.toggle('active', open);
        document.body.style.overflow = open ? 'hidden' : '';
        if (open) {
            searchInput.value = '';
            searchResultsGrid.innerHTML = '';
            searchNoResults.classList.add('hidden');
            setTimeout(() => searchInput.focus(), 100);
        }
    }

    function performSearch(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            searchResultsGrid.innerHTML = '';
            searchNoResults.classList.add('hidden');
            return;
        }

        const keywords = query.split(/\s+/).filter(k => k.length > 0);
        const matches = [];

        Object.values(CONFIG.sections).forEach(section => {
            if (section.images) {
                section.images.forEach(img => {
                    const tagString = (img.tags || []).join(' ').toLowerCase();
                    const isMatch = keywords.every(kw => tagString.includes(kw));
                    if (isMatch) {
                        matches.push(img);
                    }
                });
            }
        });

        renderSearchResults(matches);
    }

    function renderSearchResults(matches) {
        searchResultsGrid.innerHTML = '';
        if (matches.length === 0) {
            searchNoResults.classList.remove('hidden');
            return;
        }

        searchNoResults.classList.add('hidden');
        matches.forEach((imgObj, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            const img = document.createElement('img');
            img.src = imgObj.src;
            img.alt = 'Resultado de búsqueda';
            item.appendChild(img);

            item.addEventListener('click', (e) => {
                e.preventDefault();
                openLightbox(index, matches);
            });
            searchResultsGrid.appendChild(item);
        });
    }

    searchToggle.addEventListener('click', () => toggleSearch(true));
    searchClose.addEventListener('click', () => toggleSearch(false));
    searchInput.addEventListener('input', (e) => performSearch(e.target.value));

    // Close search on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            toggleSearch(false);
        }
    });

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
