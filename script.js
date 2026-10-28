/**
 * Takumi Bed Catalog - Dynamic State Orchestrator & HTML5 Canvas Renderer
 * Pure Vanilla JavaScript (Zero Dependencies)
 * Fully resilient to schema additions/removals in src.json
 */

(function () {
  'use strict';

  // =========================================================================
  // Application State
  // =========================================================================
  const state = {
    config: null,
    activeSizeId: null,
    activeOptionIds: new Set(),
    imagesLoaded: false,
    showHotspots: true,
    displayedPrice: 0,
    priceAnimFrameId: null,
    loadedImages: {
      base: null,
      layers: {}, // id -> HTMLImageElement or OffscreenCanvas
      watermark: null,
    },
  };

  // =========================================================================
  // DOM Cache
  // =========================================================================
  const dom = {
    brandName: document.getElementById('appBrandName'),
    productTitle: document.getElementById('productTitle'),
    productTagline: document.getElementById('productTagline'),
    productDescription: document.getElementById('productDescription'),
    productBadges: document.getElementById('productBadges'),
    
    // Canvas & Visualizer
    canvas: document.getElementById('bedCanvas'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    hotspotsLayer: document.getElementById('hotspotsLayer'),
    canvasLoader: document.getElementById('canvasLoader'),
    btnToggleAll: document.getElementById('btnToggleAll'),
    btnToggleAllText: document.getElementById('btnToggleAllText'),
    btnToggleHotspots: document.getElementById('btnToggleHotspots'),
    canvasToolbar: document.getElementById('canvasToolbar'),
    
    // Size Config Section
    sizeConfigBlock: document.getElementById('sizeConfigBlock'),
    sizeDivider: document.getElementById('sizeDivider'),
    activeSizeBadge: document.getElementById('activeSizeBadge'),
    sizePillsContainer: document.getElementById('sizePillsContainer'),
    
    // Options / Add-ons Section
    optionsConfigBlock: document.getElementById('optionsConfigBlock'),
    compartmentsContainer: document.getElementById('compartmentsContainer'),
    activeModulesCounter: document.getElementById('activeModulesCounter'),
    optionsStepNum: document.getElementById('optionsStepNum'),
    
    // Price Engine & Payment
    currencySymbol: document.getElementById('currencySymbol'),
    totalPriceDisplay: document.getElementById('totalPriceDisplay'),
    paymentPolicyCard: document.getElementById('paymentPolicyCard'),
    paymentPolicyTitle: document.getElementById('paymentPolicyTitle'),
    paymentPolicyBadge: document.getElementById('paymentPolicyBadge'),
    paymentPolicyDesc: document.getElementById('paymentPolicyDesc'),
    breakdownContent: document.getElementById('breakdownContent'),
    
    // Actions & WhatsApp
    whatsappBtn: document.getElementById('whatsappBtn'),
    waButtonTitle: document.getElementById('waButtonTitle'),
    btnShareConfig: document.getElementById('btnShareConfig'),
    
    // Mobile Sticky Bar
    mobileStickyBar: document.getElementById('mobileStickyBar'),
    mobileBarSize: document.getElementById('mobileBarSize'),
    mobileBarPrice: document.getElementById('mobileBarPrice'),
    mobileBarPaymentTag: document.getElementById('mobileBarPaymentTag'),
    mobileBarWhatsappBtn: document.getElementById('mobileBarWhatsappBtn'),
    
    // Toast
    toast: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
  };

  const ctx = dom.canvas ? dom.canvas.getContext('2d') : null;

  // =========================================================================
  // Safe Config Accessors & Fallbacks
  // =========================================================================
  function getCatalog() {
    return state.config?.catalog || {};
  }

  function getSizes() {
    return getCatalog().sizes || [];
  }

  /**
   * Supports `compartments`, `addons`, or `options` key dynamically from src.json.
   * If a user adds a new option (e.g. "color", "madera", "acabado"), it is treated as a valid option.
   */
  function getOptions() {
    const cat = getCatalog();
    return cat.compartments || cat.addons || cat.options || [];
  }

  function getCurrency() {
    return getCatalog().product?.currency || { symbol: "$", code: "ARS", locale: "es-AR" };
  }

  function getPaymentConfig() {
    return getCatalog().product?.payment || {
      title: "Pago al Momento de la Entrega",
      badge: "Pago Contra Entrega",
      description: "Abonás en su totalidad al recibir y revisar el producto en tu domicilio. No solicitamos señas ni anticipos previos.",
      methods: "Efectivo o Transferencia al recibir"
    };
  }

  function getActiveSize() {
    const sizes = getSizes();
    if (!sizes.length) return null;
    return sizes.find(s => s.id === state.activeSizeId) || sizes.find(s => s.isDefault) || sizes[0];
  }

  // =========================================================================
  // Bootstrap & Data Fetching
  // =========================================================================
  async function init() {
    setupAssetProtection();

    try {
      const response = await fetch('src.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      state.config = await response.json();
    } catch (err) {
      console.warn('Could not fetch src.json directly (fallback will be used):', err.message);
      state.config = getInternalFallbackConfig();
    }

    // Initialize Active Size (gracefully picks first available or default)
    const sizes = getSizes();
    if (sizes.length > 0) {
      const defaultSize = sizes.find(s => s.isDefault) || sizes[0];
      state.activeSizeId = defaultSize.id;
    } else {
      state.activeSizeId = null;
    }

    // Initialize Active Options (safe check)
    const options = getOptions();
    options.forEach(opt => {
      if (opt.defaultActive) {
        state.activeOptionIds.add(opt.id);
      }
    });

    // Populate UI Dynamically
    renderProductInfo();
    renderPaymentInfo();
    renderSizesSection();
    renderOptionsSection();
    renderHotspotsOverlay();
    updatePriceDisplay(false);
    updateWhatsAppLinks();

    // Setup Event Listeners
    setupEventListeners();

    // Load Visual Layers onto Canvas
    await loadCanvasAssets();
  }

  // =========================================================================
  // Casual Asset Theft Protection (Canvas & Context Menu)
  // =========================================================================
  function setupAssetProtection() {
    if (!dom.canvasWrapper) return;

    dom.canvasWrapper.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    dom.canvasWrapper.addEventListener('dragstart', (e) => {
      e.preventDefault();
      return false;
    });

    dom.canvasWrapper.style.webkitTouchCallout = 'none';
    dom.canvasWrapper.style.userSelect = 'none';
  }

  // =========================================================================
  // Canvas Asset Loading & Smart Multi-layer Transparency Processor
  // =========================================================================
  async function loadCanvasAssets() {
    if (!dom.canvas || !ctx) return;
    const cat = getCatalog();

    try {
      // 1. Load Base Image Layer (if configured)
      const baseSrc = cat.baseLayer?.src;
      if (baseSrc) {
        try {
          const baseImg = await loadImage(baseSrc);
          state.loadedImages.base = baseImg;
          dom.canvas.width = baseImg.naturalWidth || 896;
          dom.canvas.height = baseImg.naturalHeight || 1195;
        } catch (e) {
          console.warn('Could not load base layer image:', e.message);
        }
      }

      // 2. Load and Prepare Option/Compartment Visual Layers (only for items with layerSrc)
      const options = getOptions();
      const layerPromises = options
        .filter(opt => !!opt.layerSrc)
        .map(async (opt) => {
          try {
            const layerImg = await loadImage(opt.layerSrc);
            const prepared = prepareLayerGraphic(layerImg, state.loadedImages.base);
            state.loadedImages.layers[opt.id] = prepared;
          } catch (e) {
            console.warn(`Layer image skipped or failed for "${opt.id}":`, e.message);
          }
        });

      // 3. Load Watermark Logo (if configured)
      const watermarkSrc = cat.watermark?.src;
      const watermarkPromise = (async () => {
        if (watermarkSrc) {
          try {
            state.loadedImages.watermark = await loadImage(watermarkSrc);
          } catch (e) {
            console.warn('Watermark image not found, text fallback will be rendered:', e.message);
          }
        }
      })();

      await Promise.all([...layerPromises, watermarkPromise]);

      state.imagesLoaded = true;
      if (dom.canvasLoader) dom.canvasLoader.classList.add('loaded');
      drawCanvas();
    } catch (err) {
      console.error('Canvas assets initialization error:', err);
      state.imagesLoaded = true;
      if (dom.canvasLoader) dom.canvasLoader.classList.add('loaded');
      drawCanvas();
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  /**
   * Smart layer processor:
   * - If the layer is already a cutout PNG with transparency, uses it directly.
   * - If the layer is an opaque composite render against baseImg, isolates differences
   *   so all compartments/layers can be activated simultaneously without visual clashes.
   */
  function prepareLayerGraphic(layerImg, baseImg) {
    const w = layerImg.naturalWidth || 896;
    const h = layerImg.naturalHeight || 1195;

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    offCtx.drawImage(layerImg, 0, 0, w, h);
    const layerData = offCtx.getImageData(0, 0, w, h);
    const lPixels = layerData.data;

    // Check if image already contains alpha transparency (< 250)
    let alreadyTransparent = false;
    for (let i = 3; i < lPixels.length; i += 40) {
      if (lPixels[i] < 250) {
        alreadyTransparent = true;
        break;
      }
    }

    if (alreadyTransparent || !baseImg) {
      return layerImg; // Already transparent PNG
    }

    // Difference masking against base image
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = w;
    baseCanvas.height = h;
    const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
    baseCtx.drawImage(baseImg, 0, 0, w, h);
    const bPixels = baseCtx.getImageData(0, 0, w, h).data;

    const threshold = 18;
    const len = lPixels.length;

    for (let i = 0; i < len; i += 4) {
      const dr = Math.abs(lPixels[i] - bPixels[i]);
      const dg = Math.abs(lPixels[i + 1] - bPixels[i + 1]);
      const db = Math.abs(lPixels[i + 2] - bPixels[i + 2]);

      if (dr <= threshold && dg <= threshold && db <= threshold) {
        lPixels[i + 3] = 0;
      }
    }

    offCtx.putImageData(layerData, 0, 0);
    return offscreen;
  }

  // =========================================================================
  // Canvas Compositing & Watermark Overlay Engine
  // =========================================================================
  function drawCanvas() {
    if (!dom.canvas || !ctx) return;
    const w = dom.canvas.width;
    const h = dom.canvas.height;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Crop top seam artifact (removes dark edge margin baked into raw source renders)
    const cropTop = 5;

    // 1. Draw Base Bed Layer
    if (state.loadedImages.base) {
      const baseImg = state.loadedImages.base;
      const srcW = baseImg.naturalWidth || w;
      const srcH = baseImg.naturalHeight || h;
      ctx.drawImage(baseImg, 0, cropTop, srcW, srcH - cropTop, 0, 0, w, h);
    } else {
      drawStudioPlaceholder(ctx, w, h);
    }

    // 2. Draw Active Option Layers
    const options = getOptions();
    options.forEach(opt => {
      if (state.activeOptionIds.has(opt.id)) {
        const layerGraphic = state.loadedImages.layers[opt.id];
        if (layerGraphic) {
          const lW = layerGraphic.width || layerGraphic.naturalWidth || w;
          const lH = layerGraphic.height || layerGraphic.naturalHeight || h;
          ctx.drawImage(layerGraphic, 0, cropTop, lW, lH - cropTop, 0, 0, w, h);
        }
      }
    });

    // 3. Watermark Overlay
    drawWatermark(ctx, w, h);
  }

  function drawStudioPlaceholder(context, w, h) {
    const grad = context.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#ECEEF2');
    context.fillStyle = grad;
    context.fillRect(0, 0, w, h);

    context.fillStyle = '#64748B';
    context.font = '600 24px Plus Jakarta Sans, sans-serif';
    context.textAlign = 'center';
    context.fillText('Takumi Muebles • Cama Multifuncional', w / 2, h / 2);
  }

  function drawWatermark(context, w, h) {
    const wmConfig = getCatalog().watermark;
    if (!wmConfig) return;

    const opacity = wmConfig.opacity !== undefined ? wmConfig.opacity : 0.35;
    const margin = wmConfig.margin || 24;
    const position = wmConfig.position || 'bottom-right';

    context.save();
    context.globalAlpha = opacity;

    const logoImg = state.loadedImages.watermark;

    if (logoImg && logoImg.naturalWidth) {
      const maxLogoW = w * (wmConfig.maxWidthPercent || 0.22);
      const aspect = logoImg.naturalHeight / logoImg.naturalWidth;
      const logoW = Math.min(maxLogoW, logoImg.naturalWidth);
      const logoH = logoW * aspect;

      let x, y;
      switch (position) {
        case 'bottom-left':
          x = margin;
          y = h - logoH - margin;
          break;
        case 'top-left':
          x = margin;
          y = margin;
          break;
        case 'top-right':
          x = w - logoW - margin;
          y = margin;
          break;
        case 'bottom-right':
        default:
          x = w - logoW - margin;
          y = h - logoH - margin;
          break;
      }

      context.drawImage(logoImg, x, y, logoW, logoH);
    } else if (wmConfig.text) {
      context.font = '700 18px Plus Jakarta Sans, sans-serif';
      context.fillStyle = '#181A20';
      context.textAlign = position.includes('left') ? 'left' : 'right';
      const x = position.includes('left') ? margin : w - margin;
      const y = position.includes('top') ? margin + 20 : h - margin;
      context.fillText(wmConfig.text, x, y);
    }

    context.restore();
  }

  // =========================================================================
  // Product Information & Payment Terms (REQUISITOS 1 & 2)
  // =========================================================================
  function renderProductInfo() {
    const product = getCatalog().product;
    if (!product) return;

    if (dom.brandName && product.brand) dom.brandName.textContent = product.brand.toUpperCase();
    if (dom.productTitle && product.name) dom.productTitle.textContent = product.name;
    if (dom.productTagline && product.tagline) dom.productTagline.textContent = product.tagline;
    if (dom.productDescription && product.description) dom.productDescription.textContent = product.description;
    if (dom.currencySymbol && product.currency?.symbol) dom.currencySymbol.textContent = product.currency.symbol;

    // Badges / Highlights
    if (dom.productBadges && Array.isArray(product.badges)) {
      dom.productBadges.innerHTML = product.badges.map(badge => `
        <div class="feature-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>${badge}</span>
        </div>
      `).join('');
    }
  }

  function renderPaymentInfo() {
    const payment = getPaymentConfig();

    if (dom.paymentPolicyTitle) dom.paymentPolicyTitle.textContent = payment.title || "Pago al Momento de la Entrega";
    if (dom.paymentPolicyBadge) dom.paymentPolicyBadge.textContent = payment.badge || "100% Seguro • Sin Señas";
    if (dom.paymentPolicyDesc) dom.paymentPolicyDesc.textContent = payment.description || "Abonás en su totalidad recién cuando recibís y verificás el producto en tu domicilio.";
    if (dom.mobileBarPaymentTag) dom.mobileBarPaymentTag.textContent = payment.badge || "Pago al recibir";
  }

  // =========================================================================
  // Dynamic Sizes Section (Custom Radio Pills - NO NATIVE RADIOS)
  // Resilient: hides cleanly if sizes is empty or modified in src.json
  // =========================================================================
  function renderSizesSection() {
    const sizes = getSizes();
    const currency = getCurrency();

    if (!sizes.length) {
      if (dom.sizeConfigBlock) dom.sizeConfigBlock.style.display = 'none';
      if (dom.sizeDivider) dom.sizeDivider.style.display = 'none';
      if (dom.optionsStepNum) dom.optionsStepNum.textContent = '1';
      return;
    }

    if (dom.sizeConfigBlock) dom.sizeConfigBlock.style.display = '';
    if (dom.sizeDivider) dom.sizeDivider.style.display = '';
    if (dom.optionsStepNum) dom.optionsStepNum.textContent = '2';

    // Verify activeSize exists in current sizes
    if (!sizes.some(s => s.id === state.activeSizeId)) {
      const fallbackSize = sizes.find(s => s.isDefault) || sizes[0];
      state.activeSizeId = fallbackSize ? fallbackSize.id : null;
    }

    dom.sizePillsContainer.innerHTML = '';

    sizes.forEach(size => {
      const isActive = size.id === state.activeSizeId;
      const formattedPrice = formatPriceValue(size.basePrice || 0, currency);

      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `size-pill ${isActive ? 'is-active' : ''}`;
      pill.setAttribute('role', 'radio');
      pill.setAttribute('aria-checked', isActive ? 'true' : 'false');
      pill.setAttribute('tabindex', '0');
      pill.dataset.sizeId = size.id;

      let badgeHtml = '';
      if (size.badge) {
        badgeHtml = `<span class="pill-badge">${size.badge}</span>`;
      }

      pill.innerHTML = `
        ${badgeHtml}
        <div class="pill-top-row">
          <span class="pill-name">${size.name || 'Medida'}</span>
          <span class="pill-check-indicator" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
        </div>
        <div class="pill-dimensions">${size.dimensions || ''}</div>
        <div class="pill-price">${formattedPrice}</div>
      `;

      pill.addEventListener('click', () => selectSize(size.id));
      pill.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          selectSize(size.id);
        }
      });

      dom.sizePillsContainer.appendChild(pill);
    });

    updateActiveSizeHeaderBadge();
  }

  function selectSize(sizeId) {
    if (state.activeSizeId === sizeId) return;
    state.activeSizeId = sizeId;

    const pills = dom.sizePillsContainer.querySelectorAll('.size-pill');
    pills.forEach(pill => {
      const isSelected = pill.dataset.sizeId === sizeId;
      pill.classList.toggle('is-active', isSelected);
      pill.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    });

    updateActiveSizeHeaderBadge();
    updatePriceDisplay(true);
    updateWhatsAppLinks();

    if (navigator.vibrate) navigator.vibrate(10);
  }

  function updateActiveSizeHeaderBadge() {
    const activeSize = getActiveSize();
    if (activeSize && dom.activeSizeBadge) {
      dom.activeSizeBadge.textContent = `${activeSize.name}${activeSize.dimensions ? ` • ${activeSize.dimensions}` : ''}`;
    }
    if (activeSize && dom.mobileBarSize) {
      dom.mobileBarSize.textContent = `${activeSize.name}${activeSize.dimensions ? ` (${activeSize.dimensions})` : ''}`;
    } else if (dom.mobileBarSize) {
      dom.mobileBarSize.textContent = 'Configuración Takumi';
    }
  }

  // =========================================================================
  // Dynamic Options & Add-ons Section (REQUISITOS 3 & 4)
  // Handles any added option (e.g. "color"), renders 0 as "Gratis"
  // =========================================================================
  function renderOptionsSection() {
    const options = getOptions();
    const currency = getCurrency();

    if (!dom.compartmentsContainer) return;

    if (!options.length) {
      if (dom.optionsConfigBlock) dom.optionsConfigBlock.style.display = 'none';
      return;
    }
    if (dom.optionsConfigBlock) dom.optionsConfigBlock.style.display = '';

    // Clean up activeOptionIds: remove any IDs that no longer exist in src.json
    const validIds = new Set(options.map(o => o.id));
    state.activeOptionIds.forEach(id => {
      if (!validIds.has(id)) {
        state.activeOptionIds.delete(id);
      }
    });

    dom.compartmentsContainer.innerHTML = '';

    options.forEach(opt => {
      const isActive = state.activeOptionIds.has(opt.id);
      const isFree = !opt.price || opt.price === 0;

      // REQUISITO 3: Si un precio es 0, mostrar "Gratis"
      const priceText = isFree ? 'Gratis' : `+ ${formatPriceValue(opt.price, currency)}`;

      const card = document.createElement('div');
      card.className = `compartment-card ${isActive ? 'is-active' : ''}`;
      card.dataset.optionId = opt.id;
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
      card.setAttribute('tabindex', '0');

      let categoryBadgeHtml = '';
      if (opt.category) {
        categoryBadgeHtml = `<span class="comp-category-tag">${opt.category}</span>`;
      }

      card.innerHTML = `
        <div class="comp-left">
          <div class="comp-icon-box">
            ${getDynamicIcon(opt.icon)}
          </div>
          <div class="comp-info">
            <div class="comp-title-row">
              <span class="comp-name">${opt.name || 'Adicional'}</span>
              ${categoryBadgeHtml}
              <span class="comp-state-tag ${isActive ? 'open' : 'closed'}">
                ${isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            ${opt.description ? `<p class="comp-desc">${opt.description}</p>` : ''}
          </div>
        </div>
        <div class="comp-right">
          <span class="comp-price-tag ${isFree ? 'is-free' : ''}">${priceText}</span>
          <div class="custom-switch" aria-hidden="true">
            <span class="switch-thumb"></span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => toggleOption(opt.id));
      card.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleOption(opt.id);
        }
      });

      dom.compartmentsContainer.appendChild(card);
    });

    updateOptionsCounter();
  }

  function getDynamicIcon(type) {
    switch (type) {
      case 'shoe':
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 14h3a2 2 0 0 1 2 2v3h13a1 1 0 0 0 1-1v-4a4 4 0 0 0-4-4h-5l-4-4H3v8z"/>
          </svg>
        `;
      case 'drawers':
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="7.5" x2="14" y2="7.5"/>
            <line x1="10" y1="16.5" x2="14" y2="16.5"/>
          </svg>
        `;
      case 'trunk':
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
        `;
      case 'palette':
      case 'color':
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
          </svg>
        `;
      case 'shield':
      case 'protection':
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        `;
      default:
        return `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
          </svg>
        `;
    }
  }

  function updateOptionsCounter() {
    const total = getOptions().length;
    const active = state.activeOptionIds.size;
    if (dom.activeModulesCounter) {
      dom.activeModulesCounter.textContent = `${active} de ${total} activos`;
    }
    if (dom.btnToggleAllText) {
      dom.btnToggleAllText.textContent = active === total ? 'Cerrar Todo' : 'Abrir Todo';
    }
  }

  // =========================================================================
  // Canvas Hotspots Overlay & Bidirectional Syncing
  // Only renders pins for items that define a valid hotspot object
  // =========================================================================
  function renderHotspotsOverlay() {
    const options = getOptions();
    if (!dom.hotspotsLayer) return;

    dom.hotspotsLayer.innerHTML = '';
    const hotspotOptions = options.filter(opt => opt.hotspot && typeof opt.hotspot.xPercent === 'number');

    if (!hotspotOptions.length) {
      dom.hotspotsLayer.style.display = 'none';
      if (dom.btnToggleHotspots) dom.btnToggleHotspots.style.display = 'none';
      return;
    }

    dom.hotspotsLayer.style.display = '';
    if (dom.btnToggleHotspots) dom.btnToggleHotspots.style.display = '';

    hotspotOptions.forEach(opt => {
      const isActive = state.activeOptionIds.has(opt.id);
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = `hotspot-pin ${isActive ? 'is-active' : ''}`;
      pin.dataset.optionId = opt.id;
      pin.style.left = `${opt.hotspot.xPercent}%`;
      pin.style.top = `${opt.hotspot.yPercent}%`;
      pin.setAttribute('aria-label', `${opt.hotspot.label || opt.name}: ${isActive ? 'Abierto' : 'Cerrado'}`);

      pin.innerHTML = `
        <span class="hotspot-pulse"></span>
        <span class="hotspot-core">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        <div class="hotspot-tooltip">
          <span>${opt.hotspot.label || opt.name}</span>
          <span class="hotspot-status-badge ${isActive ? 'open' : 'closed'}">
            ${isActive ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleOption(opt.id);
      });

      dom.hotspotsLayer.appendChild(pin);
    });
  }

  /**
   * Central Synchronizer: toggles option state and syncs canvas, cards,
   * and hotspots simultaneously without errors.
   */
  function toggleOption(optId) {
    if (state.activeOptionIds.has(optId)) {
      state.activeOptionIds.delete(optId);
    } else {
      state.activeOptionIds.add(optId);
    }

    const isActive = state.activeOptionIds.has(optId);

    // 1. Sync Control Panel Card
    const card = dom.compartmentsContainer?.querySelector(`.compartment-card[data-option-id="${optId}"]`);
    if (card) {
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
      const tag = card.querySelector('.comp-state-tag');
      if (tag) {
        tag.className = `comp-state-tag ${isActive ? 'open' : 'closed'}`;
        tag.textContent = isActive ? 'Activo' : 'Inactivo';
      }
    }

    // 2. Sync Canvas Hotspot Pin (if exists)
    const pin = dom.hotspotsLayer?.querySelector(`.hotspot-pin[data-option-id="${optId}"]`);
    if (pin) {
      pin.classList.toggle('is-active', isActive);
      const statusBadge = pin.querySelector('.hotspot-status-badge');
      if (statusBadge) {
        statusBadge.className = `hotspot-status-badge ${isActive ? 'open' : 'closed'}`;
        statusBadge.textContent = isActive ? 'Abierto' : 'Cerrado';
      }
    }

    // 3. Update Canvas Rendering
    drawCanvas();

    // 4. Update Price & Counters
    updateOptionsCounter();
    updatePriceDisplay(true);
    updateWhatsAppLinks();

    if (navigator.vibrate) navigator.vibrate(10);
  }

  function toggleAllOptions() {
    const options = getOptions();
    const shouldOpen = state.activeOptionIds.size < options.length;

    options.forEach(opt => {
      const isCurrentlyActive = state.activeOptionIds.has(opt.id);
      if (shouldOpen && !isCurrentlyActive) {
        toggleOption(opt.id);
      } else if (!shouldOpen && isCurrentlyActive) {
        toggleOption(opt.id);
      }
    });
  }

  // =========================================================================
  // Dynamic Price Engine & Breakdown (REQUISITOS 1, 2, 3)
  // Calculates live price, handles price 0 as "Gratis", no installments
  // =========================================================================
  function calculateTotalPrice() {
    const activeSize = getActiveSize();
    let total = activeSize ? (activeSize.basePrice || 0) : 0;

    const options = getOptions();
    options.forEach(opt => {
      if (state.activeOptionIds.has(opt.id)) {
        total += (opt.price || 0);
      }
    });

    return total;
  }

  function updatePriceDisplay(animate = true) {
    const targetPrice = calculateTotalPrice();
    const currency = getCurrency();

    if (animate) {
      animatePrice(state.displayedPrice, targetPrice, 350);
    } else {
      state.displayedPrice = targetPrice;
      if (dom.totalPriceDisplay) dom.totalPriceDisplay.textContent = formatRawNumber(targetPrice);
    }

    // Update Mobile Sticky Bar Price
    if (dom.mobileBarPrice) {
      dom.mobileBarPrice.textContent = formatPriceValue(targetPrice, currency);
    }

    // Update Expandable Breakdown
    renderPriceBreakdown(targetPrice);
  }

  function animatePrice(start, end, duration) {
    if (state.priceAnimFrameId) cancelAnimationFrame(state.priceAnimFrameId);

    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);

      state.displayedPrice = current;
      if (dom.totalPriceDisplay) dom.totalPriceDisplay.textContent = formatRawNumber(current);

      if (progress < 1) {
        state.priceAnimFrameId = requestAnimationFrame(step);
      } else {
        state.displayedPrice = end;
        if (dom.totalPriceDisplay) dom.totalPriceDisplay.textContent = formatRawNumber(end);
      }
    }

    state.priceAnimFrameId = requestAnimationFrame(step);
  }

  function renderPriceBreakdown(totalPrice) {
    if (!dom.breakdownContent) return;
    const activeSize = getActiveSize();
    const currency = getCurrency();
    const options = getOptions();

    let html = '';

    if (activeSize) {
      html += `
        <div class="breakdown-row">
          <span>Base ${activeSize.name || 'Cama'} ${activeSize.dimensions ? `(${activeSize.dimensions})` : ''}</span>
          <span class="breakdown-value">${formatPriceValue(activeSize.basePrice || 0, currency)}</span>
        </div>
      `;
    }

    options.forEach(opt => {
      if (state.activeOptionIds.has(opt.id)) {
        const isFree = !opt.price || opt.price === 0;
        const valText = isFree ? 'Gratis' : formatPriceValue(opt.price, currency);

        html += `
          <div class="breakdown-row">
            <span>+ ${opt.name || 'Adicional'}</span>
            <span class="breakdown-value ${isFree ? 'is-free' : ''}">${valText}</span>
          </div>
        `;
      }
    });

    html += `
      <div class="breakdown-row total-row">
        <span>Total a Pagar Contra Entrega</span>
        <span class="breakdown-value">${formatPriceValue(totalPrice, currency)}</span>
      </div>
    `;

    dom.breakdownContent.innerHTML = html;
  }

  function formatPriceValue(amount, currencyConfig) {
    try {
      return new Intl.NumberFormat(currencyConfig.locale || 'es-AR', {
        style: 'currency',
        currency: currencyConfig.code || 'ARS',
        maximumFractionDigits: 0,
      }).format(amount);
    } catch (e) {
      return `${currencyConfig.symbol || '$'} ${formatRawNumber(amount)}`;
    }
  }

  function formatRawNumber(amount) {
    return (amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // =========================================================================
  // WhatsApp Integration & Sharing Engine (REQUISITOS 1, 2, 3)
  // No installments, includes payment upon delivery, handles "Gratis"
  // =========================================================================
  function generateWhatsAppMessage() {
    const cat = getCatalog();
    const activeSize = getActiveSize();
    const currency = getCurrency();
    const totalPrice = calculateTotalPrice();
    const formattedTotal = formatPriceValue(totalPrice, currency);
    const payment = getPaymentConfig();
    const options = getOptions();

    // Build options list
    let optionsText = '';
    if (state.activeOptionIds.size === 0) {
      optionsText = '• Base cerrada sin adicionales';
    } else {
      const activeList = [];
      options.forEach(opt => {
        if (state.activeOptionIds.has(opt.id)) {
          const isFree = !opt.price || opt.price === 0;
          const priceStr = isFree ? 'Gratis' : formatPriceValue(opt.price, currency);
          activeList.push(`• ${opt.name || 'Adicional'}: ${priceStr}`);
        }
      });
      optionsText = activeList.join('\n');
    }

    const waConfig = cat.whatsapp || {};
    const businessName = waConfig.businessName || 'Takumi Muebles';
    const header = waConfig.messageHeader || '🛌 *CONSULTA DE PRESUPUESTO - TAKUMI*';
    const footer = waConfig.messageFooter || '¿Tienen disponibilidad y tiempos de entrega? ¡Muchas gracias!';
    const productName = cat.product?.name || 'Cama Multifuncional Takumi';

    const sizeLine = activeSize 
      ? `📏 *Medida:* ${activeSize.name} (${activeSize.dimensions})\n💰 *Precio base:* ${formatPriceValue(activeSize.basePrice || 0, currency)}\n`
      : '';

    return `${header}
Hola ${businessName}! Me interesa consultar por la *${productName}* con la siguiente configuración:

${sizeLine}📦 *Opciones y adicionales:*
${optionsText}

💵 *PRECIO TOTAL:* ${formattedTotal}
💳 *Forma de pago:* ${payment.title || 'Se abona al momento de la entrega en destino'}.

${footer}`;
  }

  function updateWhatsAppLinks() {
    const waConfig = getCatalog().whatsapp || {};
    const phone = (waConfig.phoneNumber || '5491123456789').replace(/[^0-9]/g, '');
    const message = generateWhatsAppMessage();
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    if (dom.whatsappBtn) dom.whatsappBtn.href = waUrl;
    if (dom.mobileBarWhatsappBtn) dom.mobileBarWhatsappBtn.href = waUrl;
    if (dom.waButtonTitle && waConfig.callToAction) {
      dom.waButtonTitle.textContent = waConfig.callToAction;
    }
  }

  async function shareConfiguration() {
    const message = generateWhatsAppMessage();
    const shareData = {
      title: getCatalog().product?.name || 'Cama Takumi',
      text: message,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Configuración compartida');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to clipboard:', err);
        } else {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
        showToast('¡Configuración copiada al portapapeles!');
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('¡Copiado al portapapeles!');
      }
    } catch (e) {
      console.error('Clipboard copy failed:', e);
      showToast('No se pudo copiar el texto automáticamente');
    }
  }

  function showToast(text) {
    if (!dom.toast) return;
    dom.toastMessage.textContent = text;
    dom.toast.classList.add('show');
    clearTimeout(dom.toast._timeout);
    dom.toast._timeout = setTimeout(() => {
      dom.toast.classList.remove('show');
    }, 2800);
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================
  function setupEventListeners() {
    if (dom.btnToggleAll) {
      dom.btnToggleAll.addEventListener('click', toggleAllOptions);
    }

    if (dom.btnToggleHotspots) {
      dom.btnToggleHotspots.addEventListener('click', () => {
        state.showHotspots = !state.showHotspots;
        if (dom.hotspotsLayer) dom.hotspotsLayer.classList.toggle('hidden', !state.showHotspots);
        dom.btnToggleHotspots.classList.toggle('active', !state.showHotspots);
      });
    }

    if (dom.btnShareConfig) {
      dom.btnShareConfig.addEventListener('click', shareConfiguration);
    }

    window.addEventListener('resize', debounce(() => {
      drawCanvas();
    }, 150));
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // =========================================================================
  // Internal Fallback Config
  // =========================================================================
  function getInternalFallbackConfig() {
    return {
      catalog: {
        product: {
          id: "cama-multifuncion",
          name: "Cama Multifuncional Takumi",
          tagline: "Diseño Inteligente • Confort • Máximo Espacio de Guardado",
          description: "Fabricada en madera maciza paraíso con herrajes alemanes de alta resistencia. Diseñada para transformar el espacio de tu dormitorio combinando estética nórdica minimalista con funcionalidad de guardado inteligente.",
          brand: "Takumi Muebles",
          currency: { symbol: "$", code: "ARS", locale: "es-AR" },
          payment: {
            title: "Pago al Momento de la Entrega",
            badge: "Pago Contra Entrega",
            description: "No solicitamos señas ni anticipos previos. Abonás en su totalidad recién cuando recibís y verificás el producto en tu domicilio.",
            methods: "Efectivo o Transferencia al recibir"
          },
          badges: ["Pago Contra Entrega", "Sin Señas Previas", "Garantía de 5 Años", "Madera Maciza Paraíso"]
        },
        whatsapp: {
          phoneNumber: "5491123456789",
          businessName: "Takumi Muebles",
          callToAction: "Consultar por WhatsApp",
          messageHeader: "🛌 *CONSULTA DE PRESUPUESTO - TAKUMI*",
          messageFooter: "¿Tienen disponibilidad y tiempos de entrega para esta configuración? ¡Muchas gracias!"
        },
        watermark: {
          src: "takumi_logo.jpeg",
          text: "TAKUMI MUEBLES",
          opacity: 0.35,
          position: "bottom-right",
          margin: 24,
          maxWidthPercent: 0.22
        },
        baseLayer: {
          src: "catalogo_img_layered_cerrado.png",
          alt: "Cama Takumi cerrada base"
        },
        sizes: [
          { id: "1-plaza", name: "1 Plaza", dimensions: "0.80 x 1.90 m", basePrice: 340000, isDefault: false },
          { id: "1-plaza-media", name: "1 ½ Plaza", dimensions: "1.00 x 1.90 m", basePrice: 395000, isDefault: false },
          { id: "2-plazas", name: "2 Plazas", dimensions: "1.40 x 1.90 m", basePrice: 460000, badge: "Más Elegido", isDefault: true },
          { id: "queen", name: "Queen", dimensions: "1.60 x 2.00 m", basePrice: 520000, badge: "Recomendado", isDefault: false },
          { id: "king", name: "King", dimensions: "2.00 x 2.00 m", basePrice: 610000, isDefault: false }
        ],
        compartments: [
          {
            id: "zapatero",
            name: "Zapatero Frontal",
            shortName: "Zapatero",
            category: "Módulos de Guardado",
            description: "Módulo frontal extraíble de extracción total. Capacidad estimada para 8-12 pares de calzado.",
            icon: "shoe",
            price: 48000,
            defaultActive: false,
            layerSrc: "catalogo_img_layered_zapatero.png",
            hotspot: { xPercent: 27, yPercent: 75, label: "Zapatero", tooltip: "Tocar para abrir o cerrar zapatero" }
          },
          {
            id: "cajones",
            name: "Cajones Laterales",
            shortName: "Cajones",
            category: "Módulos de Guardado",
            description: "2 cajones amplios sobre guías telescópicas reforzadas. Ideales para sábanas y ropa de cama.",
            icon: "drawers",
            price: 58000,
            defaultActive: false,
            layerSrc: "catalogo_img_layered_cajones.png",
            hotspot: { xPercent: 81, yPercent: 69, label: "Cajones", tooltip: "Tocar para abrir o cerrar cajones" }
          },
          {
            id: "baul",
            name: "Baúl Hidráulico",
            shortName: "Baúl",
            category: "Módulos de Guardado",
            description: "Estructura elevable con pistones neumáticos de gas a presión. Acceso a todo el volumen interno de la cama.",
            icon: "trunk",
            price: 75000,
            defaultActive: false,
            layerSrc: "catalogo_img_layered_baulera.png",
            hotspot: { xPercent: 49, yPercent: 46, label: "Baúl", tooltip: "Tocar para abrir o cerrar baúl hidráulico" }
          },
          {
            id: "color-madera",
            name: "Acabado Paraíso Natural",
            shortName: "Color Natural",
            category: "Color y Lustre",
            description: "Tono cálido de veta vista con protección de laca transparente poliuretánica mate.",
            icon: "palette",
            price: 0,
            defaultActive: true
          },
          {
            id: "lustre-protector",
            name: "Tratamiento Sellador Antimanchas",
            shortName: "Sellador Hidrófugo",
            category: "Protección",
            description: "Aplicación de triple sellador hidrófugo que repele líquidos y humedad ambiente.",
            icon: "shield",
            price: 0,
            defaultActive: true
          }
        ]
      }
    };
  }

  // =========================================================================
  // Initialize Application on DOM Ready
  // =========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
