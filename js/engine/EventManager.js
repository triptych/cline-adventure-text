export class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     */
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
            if (this.listeners.get(event).size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    /**
     * Emit an event with data
     * @param {string} event - The event name
     * @param {*} data - The data to pass to listeners
     */
    emit(event, data) {
        if (this.listeners.has(event)) {
            for (const callback of this.listeners.get(event)) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            }
        }
    }

    /**
     * Subscribe to an event for one time only
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     */
    once(event, callback) {
        const onceCallback = (data) => {
            this.off(event, onceCallback);
            callback(data);
        };
        this.on(event, onceCallback);
    }

    /**
     * Clear all listeners for an event
     * @param {string} event - The event name
     */
    clearEvent(event) {
        if (this.listeners.has(event)) {
            this.listeners.delete(event);
        }
    }

    /**
     * Clear all event listeners
     */
    clearAll() {
        this.listeners.clear();
    }

    /**
     * Get the number of listeners for an event
     * @param {string} event - The event name
     * @returns {number} The number of listeners
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).size : 0;
    }

    /**
     * Check if an event has any listeners
     * @param {string} event - The event name
     * @returns {boolean} True if the event has listeners
     */
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    }

    /**
     * Get all registered event names
     * @returns {string[]} Array of event names
     */
    getEventNames() {
        return Array.from(this.listeners.keys());
    }
}
