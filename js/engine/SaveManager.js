export class SaveManager {
    constructor(gameEngine, eventManager) {
        this.gameEngine = gameEngine;
        this.eventManager = eventManager;
        this.SAVE_KEY = 'text_adventure_save';
        this.AUTO_SAVE_KEY = 'text_adventure_autosave';
        this.AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

        // Setup auto-save
        this.setupAutoSave();
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        setInterval(() => {
            this.autoSave();
        }, this.AUTO_SAVE_INTERVAL);

        // Also save when window is closed
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });
    }

    /**
     * Save the current game state
     * @param {boolean} [showMessage=true] - Whether to show a save message
     * @returns {boolean} - Whether the save was successful
     */
    saveGame(showMessage = true) {
        try {
            const gameState = this.gameEngine.getGameState();
            const saveData = {
                timestamp: Date.now(),
                state: gameState
            };

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(saveData));

            if (showMessage) {
                this.eventManager.emit('message', 'Game saved successfully.');
            }

            this.eventManager.emit('gameSaved');
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            if (showMessage) {
                this.eventManager.emit('message', 'Failed to save game.');
            }
            return false;
        }
    }

    /**
     * Auto-save the current game state
     */
    autoSave() {
        try {
            const gameState = this.gameEngine.getGameState();
            const saveData = {
                timestamp: Date.now(),
                state: gameState
            };

            localStorage.setItem(this.AUTO_SAVE_KEY, JSON.stringify(saveData));
            this.eventManager.emit('gameAutoSaved');
        } catch (error) {
            console.error('Error auto-saving game:', error);
        }
    }

    /**
     * Load a saved game state
     * @param {boolean} [useAutoSave=false] - Whether to load from auto-save
     * @returns {boolean} - Whether the load was successful
     */
    loadGame(useAutoSave = false) {
        try {
            const saveKey = useAutoSave ? this.AUTO_SAVE_KEY : this.SAVE_KEY;
            const savedData = localStorage.getItem(saveKey);

            if (!savedData) {
                this.eventManager.emit('message', 'No saved game found.');
                return false;
            }

            const { timestamp, state } = JSON.parse(savedData);

            // Check if save is older than 24 hours
            const age = Date.now() - timestamp;
            const isOld = age > 24 * 60 * 60 * 1000;

            if (isOld) {
                this.eventManager.emit('message', 'Warning: This save is more than 24 hours old.');
            }

            this.gameEngine.loadGameState(state);
            this.eventManager.emit('message', 'Game loaded successfully.');
            return true;
        } catch (error) {
            console.error('Error loading game:', error);
            this.eventManager.emit('message', 'Failed to load game.');
            return false;
        }
    }

    /**
     * Check if there is a saved game
     * @param {boolean} [checkAutoSave=false] - Whether to check for auto-save
     * @returns {boolean} - Whether a save exists
     */
    hasSavedGame(checkAutoSave = false) {
        const saveKey = checkAutoSave ? this.AUTO_SAVE_KEY : this.SAVE_KEY;
        return localStorage.getItem(saveKey) !== null;
    }

    /**
     * Get information about the saved game
     * @param {boolean} [checkAutoSave=false] - Whether to check auto-save
     * @returns {Object|null} - Save information or null if no save exists
     */
    getSaveInfo(checkAutoSave = false) {
        const saveKey = checkAutoSave ? this.AUTO_SAVE_KEY : this.SAVE_KEY;
        const savedData = localStorage.getItem(saveKey);

        if (!savedData) {
            return null;
        }

        const { timestamp, state } = JSON.parse(savedData);

        return {
            timestamp,
            playerLevel: state.player.level,
            currentRoom: state.currentRoom,
            playTime: this.calculatePlayTime(timestamp)
        };
    }

    /**
     * Calculate the play time from a timestamp
     * @param {number} timestamp - The timestamp to calculate from
     * @returns {string} - Formatted play time
     */
    calculatePlayTime(timestamp) {
        const minutes = Math.floor((Date.now() - timestamp) / 60000);

        if (minutes < 60) {
            return `${minutes} minutes`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours < 24) {
            return `${hours}h ${remainingMinutes}m`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;

        return `${days}d ${remainingHours}h ${remainingMinutes}m`;
    }

    /**
     * Delete saved game data
     * @param {boolean} [deleteAutoSave=false] - Whether to delete auto-save
     */
    deleteSave(deleteAutoSave = false) {
        if (deleteAutoSave) {
            localStorage.removeItem(this.AUTO_SAVE_KEY);
        } else {
            localStorage.removeItem(this.SAVE_KEY);
        }
        this.eventManager.emit('saveDeleted');
    }

    /**
     * Delete all saved game data
     */
    deleteAllSaves() {
        localStorage.removeItem(this.SAVE_KEY);
        localStorage.removeItem(this.AUTO_SAVE_KEY);
        this.eventManager.emit('allSavesDeleted');
    }
}
