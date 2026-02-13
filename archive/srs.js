export const SRSModule = {
    STORAGE_KEY: 'santael_srs_state',
    state: {},

    init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            this.state = JSON.parse(stored);
        }
    },

    save() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    },

    /**
     * Process a review result for an item.
     * @param {string|number} id - Unique ID of the item.
     * @param {number} quality - 0-5 rating (5=perfect, 4=good, 3=pass, <3=fail).
     *                           For binary apps usually: Correct=5, Incorrect=1.
     */
    processResult(id, quality) {
        // Default start state
        let itemData = this.state[id] || { interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: 0 };

        if (quality >= 3) {
            if (itemData.repetitions === 0) {
                itemData.interval = 1;
            } else if (itemData.repetitions === 1) {
                itemData.interval = 6;
            } else {
                itemData.interval = Math.round(itemData.interval * itemData.easeFactor);
            }
            itemData.repetitions += 1;

            // EF update
            itemData.easeFactor = itemData.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
            if (itemData.easeFactor < 1.3) itemData.easeFactor = 1.3;
        } else {
            // Reset on failure
            itemData.repetitions = 0;
            itemData.interval = 1;
        }

        // Calculate next review date (timestamp)
        const now = new Date();
        // Add interval days
        const nextDate = new Date(now.getTime() + itemData.interval * 24 * 60 * 60 * 1000);
        itemData.nextReview = nextDate.getTime();

        this.state[id] = itemData;
        this.save();
    },

    /**
     * Sorts and filters items for study.
     * Priority:
     * 1. Overdue items (nextReview < now)
     * 2. New items (no state) - Randomly mixed? 
     *    Actually, user wants "randomize starting order".
     * 3. We exclude items that are "in the future" significantly, but 
     *    maybe we should allow "cramming" if everything else is done?
     *    Let's stick to returning a sorted queue: Overdue -> New -> Future.
     */
    prioritize(items) {
        const now = Date.now();

        // Split into categories
        const due = [];
        const newItems = [];
        const future = [];

        items.forEach(item => {
            const s = this.state[item.id];
            if (!s) {
                newItems.push(item);
            } else if (s.nextReview <= now) {
                due.push(item);
            } else {
                future.push(item);
            }
        });

        // Sort due items by how overdue they are (ascending nextReview)
        due.sort((a, b) => this.state[a.id].nextReview - this.state[b.id].nextReview);

        // Randomize new items so we don't always see them in ID order
        newItems.sort(() => Math.random() - 0.5);

        // Combine: Due items first, then New items.
        // We generally hide "Future" items unless we want to allow reviewing ahead.
        // For this app, let's include them at the very end just in case, 
        // but the UI might want to stop after Due/New are done.
        // Or better, let's just return Due + New for the "Active Queue".
        // If the user finishes those, they are 'done' for the day.

        // HOWEVER, if everything is new (first run), we have a lot of new items.

        return [...due, ...newItems].concat(future); // Return all, sorted. Modules can decide when to stop.
    },

    getStatus(id) {
        const s = this.state[id];
        if (!s) return 'new';
        if (s.nextReview <= Date.now()) return 'due';
        return 'future';
    }
};

SRSModule.init();
