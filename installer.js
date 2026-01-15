export const InstallerModule = {
    deferredPrompt: null,

    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.deferredPrompt = e;
            // Update UI notify the user they can install the PWA
            this.showInstallPromotion();
            console.log(`'beforeinstallprompt' event was fired.`);
        });

        window.addEventListener('appinstalled', () => {
             // Hide the app-provided install promotion
             this.hideInstallPromotion();
             // Clear the deferredPrompt so it can be garbage collected
             this.deferredPrompt = null;
             console.log('PWA was installed');
        });
    },

    showInstallPromotion() {
        // Create a Bootstrap card element
        const promo = document.createElement('div');
        promo.id = 'install-promo';
        promo.className = 'card position-fixed shadow-lg border-0 fade-in';
        promo.style.cssText = 'bottom: 20px; right: 20px; width: 300px; z-index: 1050; display: block;';
        
        promo.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="card-title mb-0 text-primary">Install Santael</h5>
                    <button type="button" class="btn-close" aria-label="Close" id="dismiss-install"></button>
                </div>
                <p class="card-text small text-muted">Install the app for a better experience and offline access.</p>
                <button id="install-btn" class="btn btn-primary w-100">Install</button>
            </div>
        `;

        document.body.appendChild(promo);

        document.getElementById('install-btn').addEventListener('click', async () => {
             this.hideInstallPromotion();
             if (this.deferredPrompt) {
                 this.deferredPrompt.prompt();
                 const { outcome } = await this.deferredPrompt.userChoice;
                 console.log(`User response to the install prompt: ${outcome}`);
                 this.deferredPrompt = null;
             }
        });

        document.getElementById('dismiss-install').addEventListener('click', () => {
            this.hideInstallPromotion();
        });
    },

    hideInstallPromotion() {
        const promo = document.getElementById('install-promo');
        if (promo) {
            promo.remove();
        }
    }
};
