import { HomeModule } from './home.js';
import { FillerModule } from './filler.js';
import { StatsModule } from './stats.js';
import { LearningModule } from './learning.js';
import { StudyModule } from './study.js';
import { InstallerModule } from './installer.js';

export const App = {
    data: null,
    root: null,
    currentView: 'home',

    // UI Elements
    navTitle: null,
    backBtn: null,
    helpBtn: null,
    navLevel: null,
    navXP: null,
    navXP: null,
    navStreak: null,
    themeToggle: null,
    navActionBtn: null,
    actionBtnListener: null,

    async init() {
        this.root = document.getElementById('app-root');

        // Grab UI refs
        this.navTitle = document.getElementById('nav-title');
        this.backBtn = document.getElementById('nav-back-btn');
        this.helpBtn = document.getElementById('nav-help-btn');
        this.navLevel = document.getElementById('nav-level');
        this.navXP = document.getElementById('nav-xp');
        this.navStreak = document.getElementById('nav-streak');
        this.themeToggle = document.getElementById('theme-toggle');
        this.navActionBtn = document.getElementById('nav-action-btn');

        // Theme Init
        if (localStorage.getItem('santael_theme') === 'dark') {
            document.body.classList.add('dark-mode');
            if (this.themeToggle) this.themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
        }

        StatsModule.init();

        // Listeners
        window.addEventListener('stats-updated', () => this.updateNavbarStats());
        this.updateNavbarStats();

        this.backBtn.addEventListener('click', () => this.navigate('home'));
        this.helpBtn.addEventListener('click', () => LearningModule.show(this.currentView));

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark-mode');
                localStorage.setItem('santael_theme', isDark ? 'dark' : 'light');
                this.themeToggle.innerHTML = isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
            });
        }

        // Initialize Bootstrap Popovers
        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        if (window.bootstrap) {
            [...popoverTriggerList].map(popoverTriggerEl => new window.bootstrap.Popover(popoverTriggerEl));
        }

        try {
            const response = await fetch('./data.json');
            this.data = await response.json();

            // Init Learning Module
            LearningModule.init(this.data);

            window.navigateApp = (view) => this.navigate(view);
            // Expose setActionBtn globally or just use App.setActionBtn if exported?
            // Since App is exported but initialized immediately, we can attach to window for easier access from modules
            window.setNavAction = (icon, title, callback) => this.setNavAction(icon, title, callback);

            this.navigate('home');
        } catch (e) {
            console.error("Failed to init app:", e);
            this.root.innerHTML = `<div class="alert alert-danger">Error loading data.</div>`;
        }
    },

    updateNavbarStats() {
        const stats = StatsModule.getStats();
        if (this.navXP) this.navXP.innerText = stats.xp;
        if (this.navLevel) this.navLevel.innerText = stats.level;
        if (this.navStreak) this.navStreak.innerText = stats.streak;
    },

    setNavAction(icon, title, callback) {
        if (!this.navActionBtn) return;

        // Remove old listener
        if (this.actionBtnListener) {
            this.navActionBtn.removeEventListener('click', this.actionBtnListener);
        }

        this.navActionBtn.innerHTML = `<i class="bi ${icon}"></i>`;
        this.navActionBtn.title = title || '';
        this.navActionBtn.classList.remove('d-none');

        this.actionBtnListener = callback;
        this.navActionBtn.addEventListener('click', this.actionBtnListener);
    },

    updateNavbarState(title, canGoBack) {
        if (this.navTitle) this.navTitle.innerText = title;
        if (this.backBtn) {
            if (canGoBack) {
                this.backBtn.classList.remove('d-none');
            } else {
                this.backBtn.classList.add('d-none');
            }
        }

        // Show Help button only if not home
        if (this.currentView !== 'home') {
            this.helpBtn.classList.remove('d-none');
        } else {
            this.helpBtn.classList.add('d-none');
        }

        // Reset Action Btn (Modules must re-set it if needed)
        if (this.navActionBtn) {
            this.navActionBtn.classList.add('d-none');
            if (this.actionBtnListener) {
                this.navActionBtn.removeEventListener('click', this.actionBtnListener);
                this.actionBtnListener = null;
            }
        }
    },

    navigate(view) {
        this.currentView = view;
        this.root.innerHTML = '';
        window.scrollTo(0, 0);

        switch (view) {
            case 'home':
                this.updateNavbarState('ようこそ (Welcome)', false);
                HomeModule.init(this.root);
                break;
            case 'filler':
                this.updateNavbarState('Verb Conjugation', true);
                this.renderFillerWrapper();
                FillerModule.init(this.data.exercises, document.getElementById('filler-root'));
                break;
            case 'study':
                this.updateNavbarState('Study Materials', true);
                this.renderStudyWrapper();
                StudyModule.init(this.data, document.getElementById('study-root'));
                break;
            case 'particles':
                this.updateNavbarState('Particle Quiz', true);
                import('./particles.js').then(m => m.ParticlesModule.init(this.data.particles, this.root));
                break;
            case 'reorder':
                this.updateNavbarState('Sentence Builder', true);
                import('./reorder.js').then(m => m.ReorderModule.init(this.data.reorder_sentences, this.root));
                break;
            case 'kanji':
                this.updateNavbarState('Kanji Match', true);
                import('./kanji.js').then(m => m.KanjiModule.init(this.data.kanji_drills, this.root));
                break;
            default:
                this.navigate('home');
        }
    },

    renderFillerWrapper() {
        this.root.innerHTML = `
            <div class="container fade-in">                
                <div id="filler-root"></div>

                <div class="d-flex justify-content-center gap-3 mt-5">
                    <button id="reset-btn" class="btn btn-outline-secondary px-4">Reset</button>
                    <button id="check-btn" class="btn btn-primary px-5 shadow-sm">Check Answers</button>
                </div>
            </div>
        `;

        document.getElementById('check-btn').addEventListener('click', () => {
            if (FillerModule.validate()) {
                StatsModule.addXP(10);
            }
        });
        document.getElementById('reset-btn').addEventListener('click', () => FillerModule.init(this.data.exercises, document.getElementById('filler-root')));
    },

    renderStudyWrapper() {
        this.root.innerHTML = `
            <div class="container fade-in">
                <div id="study-root"></div>
            </div>
        `;
    }
};

App.init();
