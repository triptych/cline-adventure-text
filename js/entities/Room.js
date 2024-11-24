export class Room {
    constructor(id, data) {
        this.id = id;
        this.title = data.title;
        this.description = data.description;
        this.exits = { ...data.exits } || {};
        this.items = [...(data.items || [])];
        this.enemies = [...(data.enemies || [])];
        this.requirements = data.requirements || null;
        this.isExplored = false;
        this.features = data.features || [];
        this.state = { ...data.initialState } || {};
        this.events = data.events || {};
        this.visited = false;
    }

    /**
     * Get the full description of the room, including dynamic elements
     */
    getDescription() {
        let description = this.description;

        // Add feature descriptions
        if (this.features.length > 0) {
            description += '\n\n' + this.getFeatureDescriptions();
        }

        // Add state-specific descriptions
        const stateDesc = this.getStateDescription();
        if (stateDesc) {
            description += '\n\n' + stateDesc;
        }

        return description;
    }

    /**
     * Get descriptions of visible features in the room
     */
    getFeatureDescriptions() {
        return this.features
            .filter(feature => !feature.hidden)
            .map(feature => feature.description)
            .join('\n');
    }

    /**
     * Get state-specific description modifications
     */
    getStateDescription() {
        const stateDescriptions = [];

        Object.entries(this.state).forEach(([key, value]) => {
            if (this.events[key] && this.events[key].descriptions) {
                const desc = this.events[key].descriptions[value];
                if (desc) {
                    stateDescriptions.push(desc);
                }
            }
        });

        return stateDescriptions.join('\n');
    }

    /**
     * Add an item to the room
     */
    addItem(itemId) {
        if (!this.items.includes(itemId)) {
            this.items.push(itemId);
            return true;
        }
        return false;
    }

    /**
     * Remove an item from the room
     */
    removeItem(itemId) {
        const index = this.items.indexOf(itemId);
        if (index !== -1) {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Add an enemy to the room
     */
    addEnemy(enemyId) {
        if (!this.enemies.includes(enemyId)) {
            this.enemies.push(enemyId);
            return true;
        }
        return false;
    }

    /**
     * Remove an enemy from the room
     */
    removeEnemy(enemyId) {
        const index = this.enemies.indexOf(enemyId);
        if (index !== -1) {
            this.enemies.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Check if a specific exit is available
     */
    hasExit(direction) {
        return !!this.exits[direction];
    }

    /**
     * Get available exits
     */
    getAvailableExits() {
        return Object.entries(this.exits)
            .filter(([_, roomId]) => roomId !== null)
            .map(([direction, _]) => direction);
    }

    /**
     * Update room state
     */
    updateState(key, value) {
        if (this.state.hasOwnProperty(key)) {
            this.state[key] = value;
            return true;
        }
        return false;
    }

    /**
     * Trigger a room event
     */
    triggerEvent(eventId, context = {}) {
        const event = this.events[eventId];
        if (!event) return null;

        // Update state if event specifies state changes
        if (event.stateChanges) {
            Object.entries(event.stateChanges).forEach(([key, value]) => {
                this.updateState(key, value);
            });
        }

        // Return event results
        return {
            message: event.message,
            stateChanges: event.stateChanges,
            triggers: event.triggers
        };
    }

    /**
     * Mark room as explored
     */
    explore() {
        this.isExplored = true;
    }

    /**
     * Mark room as visited
     */
    visit() {
        this.visited = true;
    }

    /**
     * Hide a feature
     */
    hideFeature(featureId) {
        const feature = this.features.find(f => f.id === featureId);
        if (feature) {
            feature.hidden = true;
            return true;
        }
        return false;
    }

    /**
     * Show a feature
     */
    showFeature(featureId) {
        const feature = this.features.find(f => f.id === featureId);
        if (feature) {
            feature.hidden = false;
            return true;
        }
        return false;
    }

    /**
     * Reset room to initial state
     */
    reset() {
        this.items = [...(this.initialItems || [])];
        this.enemies = [...(this.initialEnemies || [])];
        this.state = { ...this.initialState } || {};
        this.isExplored = false;
        this.visited = false;

        // Reset features
        this.features.forEach(feature => {
            feature.hidden = feature.initiallyHidden || false;
        });
    }

    /**
     * Serialize room data for saving
     */
    serialize() {
        return {
            id: this.id,
            items: [...this.items],
            enemies: [...this.enemies],
            state: { ...this.state },
            isExplored: this.isExplored,
            visited: this.visited,
            features: this.features.map(f => ({
                ...f,
                hidden: f.hidden
            }))
        };
    }

    /**
     * Load serialized room data
     */
    loadState(data) {
        this.items = [...data.items];
        this.enemies = [...data.enemies];
        this.state = { ...data.state };
        this.isExplored = data.isExplored;
        this.visited = data.visited;

        // Restore feature states
        data.features.forEach(f => {
            const feature = this.features.find(feat => feat.id === f.id);
            if (feature) {
                feature.hidden = f.hidden;
            }
        });
    }
}
