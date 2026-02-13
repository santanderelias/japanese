export const StatsModule = {
    state: {
        xp: 0,
        level: 1,
        streak: 0,
        lastLogin: null,
        exercisesCompleted: 0
    },

    init() {
        this.load();
        this.checkStreak();
    },

    load() {
        const saved = localStorage.getItem('jp_mastery_stats');
        if (saved) {
            this.state = { ...this.state, ...JSON.parse(saved) };
        }
    },

    save() {
        localStorage.setItem('jp_mastery_stats', JSON.stringify(this.state));
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('stats-updated', { detail: this.state }));
    },

    addXP(amount) {
        this.state.xp += amount;
        this.state.exercisesCompleted++;
        this.checkLevelUp();
        this.save();
    },

    checkLevelUp() {
        // Simple level formula: Level = floor(sqrt(XP / 100)) + 1
        // Level 1: 0-99, Level 2: 100-399, etc.
        const newLevel = Math.floor(Math.sqrt(this.state.xp / 100)) + 1;
        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            this.notifyLevelUp(newLevel);
        }
    },

    checkStreak() {
        const today = new Date().toDateString();
        if (this.state.lastLogin !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (this.state.lastLogin === yesterday.toDateString()) {
                this.state.streak++;
            } else if (this.state.lastLogin !== today) {
                // Reset streak if gap > 1 day (unless it's first login)
                this.state.streak = this.state.lastLogin ? 1 : 1;
            }
            this.state.lastLogin = today;
            this.save();
        }
    },

    notifyLevelUp(level) {
        // Just a simple alert for now, could be a modal
        // Using setTimeout to allow UI to update first
        setTimeout(() => {
            alert(`おめでとう! (Congratulations!)\nYou reached Level ${level}!`);
        }, 500);
    },

    getStats() {
        return this.state;
    }
};
