import { StatsModule } from './stats.js';

export const HomeModule = {
    container: null,

    init(container) {
        this.container = container;
        this.render();
    },

    render() {
        this.container.innerHTML = `
            <div class="home-dashboard fade-in">
                <!-- Training Menu -->
                <div class="row g-4">
                    <!-- Verb Conjugation -->
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 menu-card border-0 shadow-sm" onclick="window.navigateApp('filler')">
                            <div class="card-body text-center p-4">
                                <div class="icon-box bg-primary bg-opacity-10 text-primary rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                    <i class="bi bi-pen fs-3"></i>
                                </div>
                                <h5 class="card-title mb-2">Verb Conjugation</h5>
                                <p class="card-text text-muted small">Practice polite forms</p>
                            </div>
                        </div>
                    </div>

                    <!-- Particles -->
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 menu-card border-0 shadow-sm" onclick="window.navigateApp('particles')">
                            <div class="card-body text-center p-4">
                                <div class="icon-box bg-success bg-opacity-10 text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                    <i class="bi bi-puzzle fs-3"></i>
                                </div>
                                <h5 class="card-title mb-2">Particle Quiz</h5>
                                <p class="card-text text-muted small">Master wa, ga, ni, de</p>
                            </div>
                        </div>
                    </div>

                    <!-- Sentence Reorder -->
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 menu-card border-0 shadow-sm" onclick="window.navigateApp('reorder')">
                            <div class="card-body text-center p-4">
                                <div class="icon-box bg-warning bg-opacity-10 text-dark rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                    <i class="bi bi-list-ol fs-3"></i>
                                </div>
                                <h5 class="card-title mb-2">Sentence Builder</h5>
                                <p class="card-text text-muted small">Unscramble sentences</p>
                            </div>
                        </div>
                    </div>

                    <!-- Kanji Drills -->
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 menu-card border-0 shadow-sm" onclick="window.navigateApp('kanji')">
                            <div class="card-body text-center p-4">
                                <div class="icon-box bg-danger bg-opacity-10 text-danger rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                    <i class="bi bi-translate fs-3"></i>
                                </div>
                                <h5 class="card-title mb-2">Kanji Match</h5>
                                <p class="card-text text-muted small">Match Kanji to Kana</p>
                            </div>
                        </div>
                    </div>

                    <!-- Study Materials -->
                    <div class="col-12 mt-4">
                        <div class="card h-100 menu-card border-0 shadow-sm" onclick="window.navigateApp('study')">
                            <div class="card-body d-flex align-items-center p-4">
                                <div class="icon-box bg-info bg-opacity-10 text-info rounded-circle me-4 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <i class="bi bi-journal-richtext fs-4"></i>
                                </div>
                                <div>
                                    <h5 class="card-title mb-1">Study Materials</h5>
                                    <p class="card-text text-muted small mb-0">Grammar guides and vocabulary references.</p>
                                </div>
                                <i class="bi bi-chevron-right ms-auto text-muted"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
