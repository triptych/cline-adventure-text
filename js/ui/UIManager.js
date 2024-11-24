export class UIManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.textDisplay = document.querySelector('.text-content');
        this.inventorySlots = document.getElementById('inventorySlots');
        this.mapGrid = document.getElementById('mapGrid');

        // Initialize UI elements
        this.initializeUI();

        // Setup event listeners
        this.setupEventListeners();
    }

    initializeUI() {
        // Create map grid cells
        for (let i = 0; i < 64; i++) { // 8x8 grid
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            this.mapGrid.appendChild(cell);
        }

        // Create inventory slots
        for (let i = 0; i < 12; i++) { // 3x4 grid
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            this.inventorySlots.appendChild(slot);
        }
    }

    setupEventListeners() {
        // Game events
        this.eventManager.on('message', (text) => this.displayMessage(text));
        this.eventManager.on('roomEntered', (room) => this.updateRoom(room));
        this.eventManager.on('statsUpdated', (stats) => this.updateStats(stats));
        this.eventManager.on('inventoryUpdated', (inventory) => this.updateInventory(inventory));
        this.eventManager.on('mapUpdated', (mapData) => this.updateMap(mapData));
        this.eventManager.on('combatStarted', () => this.showCombatUI());
        this.eventManager.on('combatEnded', () => this.hideCombatUI());
        this.eventManager.on('gameStarted', () => this.resetUI());
        this.eventManager.on('gameLoaded', () => this.refreshDisplay());
    }

    displayMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'game-message fade-in';
        messageElement.textContent = text;

        this.textDisplay.appendChild(messageElement);
        this.textDisplay.scrollTop = this.textDisplay.scrollHeight;

        // Limit the number of messages shown
        while (this.textDisplay.children.length > 100) {
            this.textDisplay.removeChild(this.textDisplay.firstChild);
        }
    }

    updateRoom(room) {
        // Update location display
        document.getElementById('locationStat').textContent = room.title;

        // Display room description
        this.displayMessage(`\n${room.title}`);
        this.displayMessage(room.description);

        // Update available exits
        this.updateExits(room.exits);
    }

    updateExits(exits) {
        // Enable/disable direction buttons based on available exits
        const directions = ['north', 'south', 'east', 'west'];
        directions.forEach(dir => {
            const button = document.querySelector(`[data-direction="${dir}"]`);
            if (button) {
                button.disabled = !exits[dir];
                button.classList.toggle('available', !!exits[dir]);
            }
        });
    }

    updateStats(stats) {
        // Update all stat displays
        document.getElementById('healthStat').textContent = `${stats.health}/${stats.maxHealth}`;
        document.getElementById('magicStat').textContent = `${stats.magic}/${stats.maxMagic}`;
        document.getElementById('levelStat').textContent = stats.level;
        document.getElementById('xpStat').textContent = `${stats.experience}/${stats.nextLevel}`;

        // Update health/magic bars if they exist
        this.updateStatBars(stats);
    }

    updateStatBars(stats) {
        const healthPercent = (stats.health / stats.maxHealth) * 100;
        const magicPercent = (stats.magic / stats.maxMagic) * 100;

        const healthBar = document.querySelector('.health-bar');
        const magicBar = document.querySelector('.magic-bar');

        if (healthBar) healthBar.style.width = `${healthPercent}%`;
        if (magicBar) magicBar.style.width = `${magicPercent}%`;
    }

    updateInventory(inventory) {
        // Clear all slots
        const slots = this.inventorySlots.children;
        Array.from(slots).forEach(slot => {
            slot.textContent = '';
            slot.className = 'inventory-slot';
        });

        // Fill slots with items
        inventory.forEach((itemId, index) => {
            if (index < slots.length) {
                const slot = slots[index];
                slot.textContent = itemId; // Replace with item icon/name
                slot.className = 'inventory-slot has-item';
            }
        });
    }

    updateMap(mapData) {
        const { currentRoom, exploredRooms } = mapData;
        const cells = this.mapGrid.children;

        // Reset all cells
        Array.from(cells).forEach(cell => {
            cell.className = 'map-cell';
        });

        // Mark explored rooms
        exploredRooms.forEach(roomId => {
            const index = this.getRoomMapIndex(roomId);
            if (index >= 0 && index < cells.length) {
                cells[index].classList.add('explored');
            }
        });

        // Mark current room
        const currentIndex = this.getRoomMapIndex(currentRoom);
        if (currentIndex >= 0 && currentIndex < cells.length) {
            cells[currentIndex].classList.add('current');
        }
    }

    getRoomMapIndex(roomId) {
        // Convert room ID to map grid index
        // This should be implemented based on your room layout system
        return parseInt(roomId.replace('room_', '')) || 0;
    }

    showCombatUI() {
        document.body.classList.add('in-combat');
        // Add combat-specific UI elements
    }

    hideCombatUI() {
        document.body.classList.remove('in-combat');
        // Remove combat-specific UI elements
    }

    resetUI() {
        // Clear text display
        this.textDisplay.innerHTML = '';

        // Reset inventory
        this.updateInventory([]);

        // Reset map
        Array.from(this.mapGrid.children).forEach(cell => {
            cell.className = 'map-cell';
        });

        // Reset stats
        this.updateStats({
            health: 100,
            maxHealth: 100,
            magic: 50,
            maxMagic: 50,
            level: 1,
            experience: 0,
            nextLevel: 100
        });
    }

    refreshDisplay() {
        // Refresh all UI elements
        const currentRoom = document.getElementById('locationStat').textContent;
        this.displayMessage(`\nYou are in ${currentRoom}`);
    }

    displayError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        this.textDisplay.appendChild(errorElement);
    }

    showLoadingScreen() {
        const loader = document.createElement('div');
        loader.className = 'loading-screen';
        loader.innerHTML = '<div class="loader"></div><div>Loading...</div>';
        document.body.appendChild(loader);
    }

    hideLoadingScreen() {
        const loader = document.querySelector('.loading-screen');
        if (loader) {
            loader.remove();
        }
    }
}
