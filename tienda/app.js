document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const grid = document.getElementById('product-grid');
    const headerTitle = document.querySelector('.site-header h1');
    const contactBtn = document.getElementById('contact-btn');
    const cartBtn = document.getElementById('cart-btn');
    const cartCount = document.getElementById('cart-count');

    // Floating Panels
    const cartModal = document.getElementById('cart-modal');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    const detailModal = document.getElementById('product-detail-modal');
    const closeDetailBtn = document.getElementById('close-detail');

    // Click Outside Handling
    window.addEventListener('mousedown', (e) => {
        // Close Cart
        if (cartModal.classList.contains('open')) {
            if (!cartModal.contains(e.target) && !cartBtn.contains(e.target)) {
                cartModal.classList.remove('open');
            }
        }
        // Close Detail Modal
        if (detailModal.classList.contains('open')) {
            // Check if click is inside modal OR on any "more info" button
            const isMoreInfoBtn = e.target.closest('.btn-more-info');
            if (!detailModal.contains(e.target) && !isMoreInfoBtn) {
                detailModal.classList.remove('open');
            }
        }
    });

    const detailElements = {
        title: document.getElementById('detail-title'),
        image: document.getElementById('detail-image'),
        price: document.getElementById('detail-price'),
        desc: document.getElementById('detail-description'),
        features: document.getElementById('detail-features-container'),
        qtyVal: document.getElementById('detail-qty'),
        minus: document.getElementById('detail-minus'),
        plus: document.getElementById('detail-plus'),
        buyNow: document.getElementById('detail-buy-now'),
        addCart: document.getElementById('detail-add-cart')
    };

    // State (config and products are loaded from external files)
    let cart = {};
    let currentDetailProductId = null;
    let currentDetailQty = 1;

    // --- Helpers ---
    const formatPrice = (price) => {
        const { currency_code, currency_symbol } = config.store_info;
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency_code,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(price);
        } catch (e) {
            return `${currency_symbol}${Math.round(price)}`;
        }
    };

    // --- Core Logic ---

    // 1. Init
    const init = () => {
        // Update Static UI from config
        if (config.store_info.name) {
            document.title = config.store_info.name;
            headerTitle.textContent = config.store_info.name;
        }
        if (config.store_info.footer_message) {
            const footerText = document.querySelector('.site-footer p');
            if (footerText) footerText.textContent = config.store_info.footer_message;
        }
        const phone = config.whatsapp.phone || '';
        contactBtn.href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;

        // Sort products
        const { default_sort_by, default_sort_order } = config.display;
        products.sort((a, b) => {
            let valA = a[default_sort_by];
            let valB = b[default_sort_by];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return default_sort_order === 'asc' ? -1 : 1;
            if (valA > valB) return default_sort_order === 'asc' ? 1 : -1;
            return 0;
        });

        renderGrid();
    };

    // 2. Render Grid
    const renderGrid = () => {
        grid.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            card.innerHTML = `
                <div class="product-image-container">
                    <img src="${product.image || 'https://via.placeholder.com/300'}" alt="${product.title}" class="product-image" loading="lazy">
                </div>
                <div class="product-info">
                    <h2 class="product-title">${product.title}</h2>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <button class="btn-more-info" data-id="${product.id}">
                        <span>+</span> Más Info
                    </button>
                </div>
            `;

            card.querySelector('.btn-more-info').onclick = () => openDetail(product);

            // Add zoom functionality to catalog image
            const img = card.querySelector('.product-image');
            setupCatalogImageZoom(img);

            grid.appendChild(card);
        });
    };

    // 3. Detail Popup Logic
    const openDetail = (product) => {
        currentDetailProductId = product.id;
        currentDetailQty = 1;

        detailElements.title.textContent = product.title;
        detailElements.image.src = product.image || '';
        detailElements.price.textContent = formatPrice(product.price);
        detailElements.desc.textContent = product.description || 'No hay descripción disponible.';

        // Render Features
        if (detailElements.features) {
            detailElements.features.innerHTML = ''; // Clear
            if (product.features && Array.isArray(product.features) && product.features.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'detail-features';
                product.features.forEach(feature => {
                    const li = document.createElement('li');
                    li.textContent = feature;
                    ul.appendChild(li);
                });
                detailElements.features.appendChild(ul);
            }
        }

        detailElements.qtyVal.textContent = currentDetailQty;

        // "Order 1 Now" Button: Direct WhatsApp for Single Item
        const phone = config.whatsapp.phone || '';
        const msg = encodeURIComponent(`Hola, me gustaría pedir: ${product.title} (Precio: ${formatPrice(product.price)})`);
        detailElements.buyNow.href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`;
        detailElements.buyNow.textContent = `Pedir ${currentDetailQty} ahora`;

        // "Add to Cart" Button
        detailElements.addCart.textContent = "Agregar al Carrito";
        detailElements.addCart.disabled = false;

        // Enable/Disable Image Zoom based on config
        setupImageZoom();

        // Setup scroll indicator
        setupScrollIndicator();

        // Open
        cartModal.classList.remove('open'); // Close cart if open
        detailModal.classList.add('open');
    };

    // Scroll Indicator Logic
    const setupScrollIndicator = () => {
        const scrollIndicator = document.getElementById('scroll-indicator');
        const panelContent = detailModal.querySelector('.panel-content');

        // Function to check if scroll indicator should be visible
        const checkScrollIndicator = () => {
            if (!panelContent) return;

            const hasOverflow = panelContent.scrollHeight > panelContent.clientHeight;
            const isAtBottom = panelContent.scrollHeight - panelContent.scrollTop <= panelContent.clientHeight + 10;

            if (hasOverflow && !isAtBottom) {
                scrollIndicator.classList.add('visible');
            } else {
                scrollIndicator.classList.remove('visible');
            }
        };

        // Check on modal open (with slight delay for content to render)
        setTimeout(checkScrollIndicator, 100);

        // Remove old scroll listener if exists
        panelContent.removeEventListener('scroll', checkScrollIndicator);

        // Add scroll listener
        panelContent.addEventListener('scroll', checkScrollIndicator);

        // Click handler to scroll down
        scrollIndicator.onclick = () => {
            panelContent.scrollBy({
                top: 200,
                behavior: 'smooth'
            });
        };
    };

    // Image Zoom Feature
    const setupImageZoom = () => {
        const img = detailElements.image;

        // Remove zoom class and inline styles first
        img.classList.remove('zoom-enabled');
        img.style.transform = '';
        img.style.transformOrigin = '';

        // Hide caption by default
        const caption = detailModal.querySelector('.zoom-caption');
        if (caption) caption.style.display = 'none';

        // Remove old event listeners by cloning (clean slate)
        const clone = img.cloneNode(true);
        img.parentNode.replaceChild(clone, img);
        detailElements.image = clone;

        if (config.features && config.features.imageZoom) {
            clone.classList.add('zoom-enabled');

            // Show caption if zoom is enabled
            const caption = detailModal.querySelector('.zoom-caption');
            if (caption) caption.style.display = 'block';

            let rafId = null;
            let isZoomed = false;

            // Desktop: Mouse events
            clone.addEventListener('mousemove', (e) => {
                // Use requestAnimationFrame for performance
                if (rafId) return;

                rafId = requestAnimationFrame(() => {
                    const rect = clone.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;

                    clone.style.transformOrigin = `${x}% ${y}%`;
                    clone.style.transform = 'scale(2)';
                    rafId = null;
                });
            });

            clone.addEventListener('mouseleave', () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                clone.style.transform = 'scale(1)';
            });

            // Mobile: Touch events
            clone.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                isZoomed = true;

                const touch = e.touches[0];
                const rect = clone.getBoundingClientRect();
                const x = ((touch.clientX - rect.left) / rect.width) * 100;
                const y = ((touch.clientY - rect.top) / rect.height) * 100;

                clone.style.transformOrigin = `${x}% ${y}%`;
                clone.style.transform = 'scale(2)';
            }, { passive: false });

            clone.addEventListener('touchmove', (e) => {
                if (!isZoomed) return;
                e.preventDefault();

                // Use requestAnimationFrame for performance
                if (rafId) return;

                rafId = requestAnimationFrame(() => {
                    const touch = e.touches[0];
                    const rect = clone.getBoundingClientRect();
                    const x = ((touch.clientX - rect.left) / rect.width) * 100;
                    const y = ((touch.clientY - rect.top) / rect.height) * 100;

                    clone.style.transformOrigin = `${x}% ${y}%`;
                    clone.style.transform = 'scale(2)';
                    rafId = null;
                });
            }, { passive: false });

            clone.addEventListener('touchend', () => {
                isZoomed = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                clone.style.transform = 'scale(1)';
            });

            clone.addEventListener('touchcancel', () => {
                isZoomed = false;
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
                clone.style.transform = 'scale(1)';
            });
        }
    };

    // Catalog Image Zoom Feature
    const setupCatalogImageZoom = (img) => {
        if (!config.features || !config.features.imageZoom) return;

        let rafId = null;
        let isZoomed = false;

        // Desktop: Mouse events
        img.addEventListener('mousemove', (e) => {
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                const rect = img.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                img.style.transformOrigin = `${x}% ${y}%`;
                img.style.transform = 'scale(2)';
                rafId = null;
            });
        });

        img.addEventListener('mouseleave', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            img.style.transform = 'scale(1)';
        });

        // Mobile: Touch events
        img.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isZoomed = true;

            const touch = e.touches[0];
            const rect = img.getBoundingClientRect();
            const x = ((touch.clientX - rect.left) / rect.width) * 100;
            const y = ((touch.clientY - rect.top) / rect.height) * 100;

            img.style.transformOrigin = `${x}% ${y}%`;
            img.style.transform = 'scale(2)';
        }, { passive: false });

        img.addEventListener('touchmove', (e) => {
            if (!isZoomed) return;
            e.preventDefault();

            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                const touch = e.touches[0];
                const rect = img.getBoundingClientRect();
                const x = ((touch.clientX - rect.left) / rect.width) * 100;
                const y = ((touch.clientY - rect.top) / rect.height) * 100;

                img.style.transformOrigin = `${x}% ${y}%`;
                img.style.transform = 'scale(2)';
                rafId = null;
            });
        }, { passive: false });

        img.addEventListener('touchend', () => {
            isZoomed = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            img.style.transform = 'scale(1)';
        });

        img.addEventListener('touchcancel', () => {
            isZoomed = false;
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            img.style.transform = 'scale(1)';
        });
    };

    const updateDetailQty = () => {
        detailElements.qtyVal.textContent = currentDetailQty;
        // Update "Order X Now" text
        const product = products.find(p => p.id === currentDetailProductId);
        if (product) {
            const total = product.price * currentDetailQty;
            const msg = encodeURIComponent(`Hola, me gustaría pedir: ${product.title} x${currentDetailQty} (Total: ${formatPrice(total)})`);
            const phone = config.whatsapp.phone || '';
            detailElements.buyNow.href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${msg}`;
            detailElements.buyNow.textContent = `Pedir ${currentDetailQty} ahora`;
        }
    };

    detailElements.minus.onclick = () => {
        if (currentDetailQty > 1) {
            currentDetailQty--;
            updateDetailQty();
        }
    };
    detailElements.plus.onclick = () => {
        currentDetailQty++;
        updateDetailQty();
    };

    detailElements.addCart.onclick = () => {
        if (!currentDetailProductId) return;
        addToCart(currentDetailProductId, currentDetailQty);
        detailModal.classList.remove('open');
        // Optional: Open Cart to show feedback? Or just update badge?
        // Let's just update badge and show cart briefly or just update badge.
        // For better UX, let's open the cart to confirm.
        setTimeout(() => cartModal.classList.add('open'), 200);
    };

    closeDetailBtn.onclick = () => detailModal.classList.remove('open');

    // 4. Cart Logic
    const addToCart = (id, qty) => {
        cart[id] = (cart[id] || 0) + qty;
        updateCartUI();
    };

    const removeFromCart = (id) => {
        delete cart[id];
        updateCartUI();
    };

    const updateCartUI = () => {
        const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
        const emptyMessage = document.getElementById('empty-cart-message');

        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

        // Clear cart items (but keep empty message)
        const items = cartItemsContainer.querySelectorAll('.cart-item');
        items.forEach(item => item.remove());

        let total = 0;

        if (totalItems === 0) {
            emptyMessage.style.display = 'block';
            checkoutBtn.style.display = 'none';
            document.querySelector('.cart-total').style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            checkoutBtn.style.display = 'block';
            document.querySelector('.cart-total').style.display = 'flex';

            Object.entries(cart).forEach(([id, qty]) => {
                const product = products.find(p => p.id === id);
                if (!product) return;
                total += product.price * qty;

                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <div>
                       <div style="font-weight:500">${product.title}</div>
                       <div style="font-size:0.85rem; color:#666">${qty} x ${formatPrice(product.price)}</div>
                    </div>
                    <button class="cart-remove" aria-label="Eliminar">×</button>
                `;
                div.querySelector('.cart-remove').onclick = () => removeFromCart(id);
                cartItemsContainer.appendChild(div);
            });
        }

        cartTotalPrice.textContent = formatPrice(total);

        // Checkout Link
        const phone = config.whatsapp.phone || '';
        let msg = `Hola, me gustaría hacer un pedido:\n\n`;
        Object.entries(cart).forEach(([id, qty]) => {
            const p = products.find(x => x.id === id);
            if (p) msg += `- ${p.title} x${qty}\n`;
        });
        msg += `\nTotal: ${formatPrice(total)}`;
        checkoutBtn.href = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;


        // Add "Select More Products" Button Logic ?
        // It's in the HTML now (added below), so we just need to bind it?
        // Or if I add it dynamically here? Let's assume it's in HTML or added here?
        // Since I'm rewriting this function, I should rely on the HTML footprint.
        // In the previous step I didn't add the button to HTML. I should do it in valid HTML first or inject it.
        // I'll render the footer dynamic content here actually? No, the footer has buttons.

    };

    // UI Events
    cartBtn.onclick = () => {
        detailModal.classList.remove('open'); // Close detail if open
        cartModal.classList.toggle('open');
    };
    closeCartBtn.onclick = () => cartModal.classList.remove('open');

    // Continue Shopping Button Logic
    const continueBtn = document.getElementById('continue-shopping-btn');
    if (continueBtn) {
        continueBtn.onclick = () => {
            cartModal.classList.remove('open');
        };
    }


    // Start
    init();
});
