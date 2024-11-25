export class UIManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.textDisplay = document.querySelector('.text-content');
        this.inventorySlots = document.getElementById('inventorySlots');
        this.mapGrid = document.getElementById('mapGrid');

        // Item type to emoji mapping
        this.itemEmojis = {
            key: '🔑',
            consumable: '🧪',
            weapon: '⚔️',
            armor: '🛡️',
            quest: '⭐',
            accessory: '💍',
            scroll: '📜',
            book: '📚',
            herb: '🌿',
            potion: '🧪',
            crystal: '💎',
            artifact: '🏺'
        };

        // Initialize UI elements
        this.initializeUI();

        // Setup event listeners
        this.setupEventListeners();
    }

    async showBootSequence() {
        this.textDisplay.innerHTML = '';
        const bootArt = `
╔══════════════════════════════════════════════════════════════╗
║                    TEXT ADVENTURE OS v1.0                     ║
╚══════════════════════════════════════════════════════════════╝

`;
        const bootMessages = [
            "BIOS Version 1.0.14",
            "CPU: TEXT-86 @ 4.77 MHz",
            "Memory Test: 640K OK",
            "INITIALIZING SYSTEM...",
            "LOADING CORE MODULES...",
            "CHECKING MEMORY BANKS...",
            "INITIALIZING TEXT ENGINE...",
            "LOADING GAME DATA...",
            "CALIBRATING ADVENTURE PARAMETERS...",
            "SYSTEM READY"
        ];

        // Display boot art
        await this.typeText(bootArt, 1, false);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Display boot messages with dots animation
        for (const message of bootMessages) {
            await this.typeText(message, 50, true);
            if (message !== "SYSTEM READY") {
                await this.animateDots();
                await this.typeText(" [OK]\n", 50, true);
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        // Final boot message
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.typeText("\nWELCOME TO TEXT ADVENTURE OS\n", 50, true);
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.typeText("PRESS ANY KEY TO BEGIN YOUR ADVENTURE...\n\n", 50, true);
    }

    async typeText(text, speed, withBootEffect = false) {
        for (const char of text) {
            const span = document.createElement('span');
            if (withBootEffect) {
                span.className = 'boot-text';
            }
            span.textContent = char;
            this.textDisplay.appendChild(span);
            this.textDisplay.scrollTop = this.textDisplay.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    }

    async animateDots() {
        for (let i = 0; i < 3; i++) {
            await this.typeText(".", 300, true);
        }
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
        this.eventManager.on('roomEntered', (roomData) => this.updateRoom(roomData));
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

        // Use requestAnimationFrame to ensure DOM updates before scrolling
        requestAnimationFrame(() => {
            messageElement.addEventListener('animationend', () => {
                requestAnimationFrame(() => {
                    this.textDisplay.scrollTop = this.textDisplay.scrollHeight;
                });
            }, { once: true });

            // Also scroll immediately
            this.textDisplay.scrollTop = this.textDisplay.scrollHeight;
        });

        // Limit the number of messages shown
        while (this.textDisplay.children.length > 100) {
            this.textDisplay.removeChild(this.textDisplay.firstChild);
        }
    }

    updateRoom(roomData) {
        const { room, itemNames } = roomData;

        // Update location display
        document.getElementById('locationStat').textContent = room.title;

        // Display room description
        this.displayMessage(`\n${room.title}`);
        this.displayMessage(room.description);

        // Display available exits
        const availableExits = room.getAvailableExits();
        if (availableExits.length > 0) {
            this.displayMessage('\nAvailable exits:');
            availableExits.forEach(exit => {
                this.displayMessage(`- ${exit}`);
            });
        } else {
            this.displayMessage('\nThere are no visible exits.');
        }

        // Display items that can be picked up
        if (itemNames && itemNames.length > 0) {
            this.displayMessage('\nItems in the room:');
            itemNames.forEach(item => {
                this.displayMessage(`- ${item.name}`);
            });
        }

        // Update available exits for UI buttons
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

    getItemEmoji(itemId) {
        // Get item data from the game's item database
        const itemData = window.gameItems?.items[itemId];
        if (!itemData) return '❓';

        // Check item tags first for more specific emoji
        if (itemData.tags) {
            for (const tag of itemData.tags) {
                if (this.itemEmojis[tag]) {
                    return this.itemEmojis[tag];
                }
            }
        }

        // Fallback to type-based emoji
        return this.itemEmojis[itemData.type] || '❓';
    }

    updateInventory(inventory) {
        // Clear all slots
        const slots = this.inventorySlots.children;
        Array.from(slots).forEach(slot => {
            slot.textContent = '';
            slot.className = 'inventory-slot';
            slot.removeAttribute('title');
        });

        // Fill slots with items
        inventory.forEach((itemId, index) => {
            if (index < slots.length) {
                const slot = slots[index];
                const itemData = window.gameItems?.items[itemId];

                // Set the emoji
                slot.textContent = this.getItemEmoji(itemId);

                // Set the tooltip with item name
                if (itemData) {
                    slot.title = itemData.name;
                }

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
        // Map room IDs to grid positions
        const roomMap = {
            'throne_room': 27,      // Top center (8x8 grid, row 3, col 3)
            'great_hall': 35,       // Middle center
            'dining_hall': 36,      // Middle right
            'library': 34,          // Middle left
            'garden': 44,           // Bottom right
            'start_room': 43,       // Bottom center
            'guardroom': 42         // Bottom left
        };

        return roomMap[roomId] || 0;
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
