import { Player } from '../entities/Player.js';
import { Room } from '../entities/Room.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../entities/Item.js';
import { Quest } from '../entities/Quest.js';
import { Maze } from '../entities/Maze.js';

export class GameEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.player = null;
        this.currentRoom = null;
        this.rooms = new Map();
        this.items = new Map();
        this.enemies = new Map();
        this.quests = new Map();
        this.mazes = new Map();
    }

    async loadGameData() {
        try {
            // Load all game data with error handling
            const [roomsData, itemsData, enemiesData, questsData, mazesData] = await Promise.all([
                this.fetchWithFallback('data/rooms.json'),
                this.fetchWithFallback('data/items.json'),
                this.fetchWithFallback('data/enemies.json'),
                this.fetchWithFallback('data/quests.json'),
                this.fetchWithFallback('data/mazes.json')
            ]);

            console.log('Loaded items data:', itemsData); // Debug log

            // Initialize game objects
            this.initializeRooms(roomsData.rooms);
            this.initializeItems(itemsData.items);
            this.initializeEnemies(enemiesData.enemies);
            this.initializeQuests(questsData.quests);
            this.initializeMazes(mazesData.mazes);

            console.log('Items Map after initialization:', Array.from(this.items.entries())); // Debug log

            this.eventManager.emit('dataLoaded');
        } catch (error) {
            console.error('Error loading game data:', error);
            this.eventManager.emit('error', 'Failed to load game data. Please refresh the page.');
            throw error;
        }
    }

    async fetchWithFallback(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`Failed to load ${url}, using empty data:`, error);
            // Return empty data structure as fallback
            return {
                rooms: {},
                items: {},
                enemies: {},
                quests: {},
                mazes: {}
            };
        }
    }

    initializeRooms(roomsData) {
        if (!roomsData || Object.keys(roomsData).length === 0) {
            // Provide a default starting room if no data
            roomsData = {
                start_room: {
                    title: "Castle Entrance",
                    description: "You stand before an ancient castle gate. The weathered stone walls loom high above you.",
                    exits: {},
                    items: [],
                    enemies: []
                }
            };
        }

        for (const [id, data] of Object.entries(roomsData)) {
            this.rooms.set(id, new Room(id, data));
        }
    }

    initializeItems(itemsData) {
        console.log('Initializing items with data:', itemsData); // Debug log

        if (!itemsData || Object.keys(itemsData).length === 0) {
            // Provide a default item if no data
            itemsData = {
                basic_potion: {
                    name: "Basic Potion",
                    description: "A simple healing potion.",
                    type: "consumable",
                    effects: { health: 20 },
                    usable: true,
                    consumable: true
                }
            };
        }

        for (const [id, data] of Object.entries(itemsData)) {
            console.log(`Creating item with id: ${id}, data:`, data); // Debug log
            this.items.set(id, new Item(id, data));
        }

        console.log('Items Map after creation:', Array.from(this.items.entries())); // Debug log
    }

    initializeEnemies(enemiesData) {
        if (!enemiesData || Object.keys(enemiesData).length === 0) {
            // Provide a default enemy if no data
            enemiesData = {
                basic_enemy: {
                    name: "Castle Guard",
                    description: "A basic enemy guard.",
                    health: 50,
                    attack: 10,
                    defense: 5,
                    experience: 50
                }
            };
        }

        for (const [id, data] of Object.entries(enemiesData)) {
            this.enemies.set(id, new Enemy(id, data));
        }
    }

    initializeQuests(questsData) {
        if (!questsData || Object.keys(questsData).length === 0) {
            // Provide a default quest if no data
            questsData = {
                tutorial_quest: {
                    title: "Castle Explorer",
                    description: "Explore the castle grounds.",
                    objectives: [{
                        type: "visit",
                        target: "start_room",
                        quantity: 1
                    }],
                    rewards: {
                        experience: 50
                    }
                }
            };
        }

        for (const [id, data] of Object.entries(questsData)) {
            this.quests.set(id, new Quest(id, data));
        }
    }

    initializeMazes(mazesData) {
        if (!mazesData || Object.keys(mazesData).length === 0) {
            // Provide a default maze if no data
            mazesData = {
                tutorial_maze: {
                    name: "Practice Maze",
                    description: "A simple training maze.",
                    grid_size: { width: 3, height: 3 },
                    start_position: { x: 0, y: 0 },
                    end_position: { x: 2, y: 2 }
                }
            };
        }

        for (const [id, data] of Object.entries(mazesData)) {
            this.mazes.set(id, new Maze(id, data));
        }
    }

    startNewGame() {
        // Create new player
        this.player = new Player({
            health: 100,
            maxHealth: 100,
            magic: 50,
            maxMagic: 50,
            level: 1,
            experience: 0,
            inventory: []
        });

        // Set starting room
        const startRoom = this.rooms.get('start_room');
        if (startRoom) {
            this.currentRoom = startRoom;
            // Mark starting room as explored
            this.currentRoom.explore();
            console.log('Starting room items:', this.currentRoom.items); // Debug log
        } else {
            console.error('No start room found!');
            return;
        }

        // Reset game state
        this.resetGameState();

        // Trigger initial game events
        this.eventManager.emit('gameStarted');
        this.emitRoomEntered();
        this.eventManager.emit('statsUpdated', this.player.getStats());
        this.updateExploredRooms(this.currentRoom.id);
    }

    resetGameState() {
        // Reset rooms
        this.rooms.forEach(room => {
            if (typeof room.reset === 'function') {
                room.reset();
            }
        });

        // Reset quests
        this.quests.forEach(quest => {
            if (typeof quest.reset === 'function') {
                quest.reset();
            }
        });

        // Reset enemies
        this.enemies.forEach(enemy => {
            if (typeof enemy.reset === 'function') {
                enemy.reset();
            }
        });

        // Reset mazes
        this.mazes.forEach(maze => {
            if (typeof maze.reset === 'function') {
                maze.reset();
            }
        });
    }

    movePlayer(direction) {
        const nextRoomId = this.currentRoom.exits[direction];

        if (!nextRoomId) {
            this.eventManager.emit('message', "You can't go that way.");
            return;
        }

        const nextRoom = this.rooms.get(nextRoomId);

        // Check if room has requirements
        if (nextRoom.requirements) {
            if (!this.checkRoomRequirements(nextRoom.requirements)) {
                return;
            }
        }

        this.currentRoom = nextRoom;
        // Mark the room as explored when entering
        this.currentRoom.explore();
        this.emitRoomEntered();
        this.updateExploredRooms(nextRoomId);
    }

    emitRoomEntered() {
        console.log('Current room items before mapping:', this.currentRoom.items); // Debug log
        console.log('Items Map contents:', Array.from(this.items.entries())); // Debug log

        // Get item names for items in the room
        const itemNames = this.currentRoom.items
            .map(itemId => {
                const item = this.items.get(itemId);
                console.log(`Looking up item with id: ${itemId}, found:`, item); // Debug log
                return item ? { id: itemId, name: item.name } : null;
            })
            .filter(item => item !== null); // Filter out any null items

        console.log('Resolved item names:', itemNames); // Debug log

        // Create room data with item names
        const roomData = {
            room: this.currentRoom,
            itemNames: itemNames
        };

        // Emit room entered event
        this.eventManager.emit('roomEntered', roomData);
    }

    checkRoomRequirements(requirements) {
        if (requirements.item && !this.player.hasItem(requirements.item)) {
            const item = this.items.get(requirements.item);
            this.eventManager.emit('message', `You need ${item.name} to enter this room.`);
            return false;
        }

        if (requirements.quest && !this.quests.get(requirements.quest).isCompleted()) {
            const quest = this.quests.get(requirements.quest);
            this.eventManager.emit('message', `You must complete "${quest.title}" to enter this room.`);
            return false;
        }

        return true;
    }

    performAction(action) {
        switch (action) {
            case 'look':
                this.lookAround();
                break;
            case 'take':
                this.takeItem();
                break;
            case 'use':
                this.useItem();
                break;
            case 'talk':
                this.talkToNPC();
                break;
        }
    }

    lookAround() {
        const description = this.currentRoom.getDescription();
        console.log('Looking around room with items:', this.currentRoom.items); // Debug log

        const items = this.currentRoom.items
            .map(id => {
                const item = this.items.get(id);
                console.log(`Looking up item with id: ${id}, found:`, item); // Debug log
                return item ? item.name : null;
            })
            .filter(name => name !== null)
            .join(', ');

        const enemies = this.currentRoom.enemies
            .map(id => {
                const enemy = this.enemies.get(id);
                return enemy ? enemy.name : null;
            })
            .filter(name => name !== null)
            .join(', ');

        let message = description;
        if (items) message += `\nYou see: ${items}`;
        if (enemies) message += `\nEnemies present: ${enemies}`;

        this.eventManager.emit('message', message);
    }

    takeItem() {
        if (!this.currentRoom.items.length) {
            this.eventManager.emit('message', "There's nothing here to take.");
            return;
        }

        // For simplicity, take the first item in the room
        const itemId = this.currentRoom.items[0];
        const item = this.items.get(itemId);

        if (!item) {
            console.error(`Item ${itemId} not found in items map`);
            return;
        }

        this.player.addItem(itemId);
        this.currentRoom.removeItem(itemId);

        this.eventManager.emit('message', `You took the ${item.name}.`);
        this.eventManager.emit('inventoryUpdated', this.player.inventory);
        // Re-emit room entered to update item list
        this.emitRoomEntered();
    }

    useItem() {
        if (!this.player.inventory.length) {
            this.eventManager.emit('message', "You don't have any items to use.");
            return;
        }

        // For simplicity, use the first item in inventory
        const itemId = this.player.inventory[0];
        const item = this.items.get(itemId);

        if (!item) {
            console.error(`Item ${itemId} not found in items map`);
            return;
        }

        if (!item.usable) {
            this.eventManager.emit('message', `You can't use the ${item.name}.`);
            return;
        }

        // Apply item effects
        if (item.effects) {
            this.player.applyEffects(item.effects);
            this.player.removeItem(itemId);
            this.eventManager.emit('message', `You used the ${item.name}.`);
            this.eventManager.emit('statsUpdated', this.player.getStats());
            this.eventManager.emit('inventoryUpdated', this.player.inventory);
        }
    }

    talkToNPC() {
        // Implement NPC dialogue system
        this.eventManager.emit('message', "There's no one here to talk to.");
    }

    updateExploredRooms(roomId) {
        // Update map with all explored rooms
        this.eventManager.emit('mapUpdated', {
            currentRoom: roomId,
            exploredRooms: Array.from(this.rooms.keys())
                .filter(id => this.rooms.get(id).isExplored)
        });
    }

    getGameState() {
        return {
            player: this.player.serialize(),
            currentRoom: this.currentRoom.id,
            exploredRooms: Array.from(this.rooms.keys())
                .filter(id => this.rooms.get(id).isExplored)
                .map(id => ({
                    id,
                    items: this.rooms.get(id).items,
                    enemies: this.rooms.get(id).enemies
                })),
            quests: Array.from(this.quests.values())
                .map(quest => quest.serialize())
        };
    }

    loadGameState(state) {
        // Restore player
        this.player = new Player(state.player);

        // Restore current room
        this.currentRoom = this.rooms.get(state.currentRoom);

        // Restore explored rooms
        state.exploredRooms.forEach(roomState => {
            const room = this.rooms.get(roomState.id);
            room.isExplored = true;
            room.items = roomState.items;
            room.enemies = roomState.enemies;
        });

        // Restore quests
        state.quests.forEach(questState => {
            const quest = this.quests.get(questState.id);
            quest.loadState(questState);
        });

        // Update UI
        this.eventManager.emit('gameLoaded');
        this.emitRoomEntered();
        this.eventManager.emit('statsUpdated', this.player.getStats());
        this.eventManager.emit('inventoryUpdated', this.player.inventory);
        this.updateExploredRooms(this.currentRoom.id);
    }
}
