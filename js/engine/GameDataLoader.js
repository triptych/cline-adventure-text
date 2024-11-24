export class GameDataLoader {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    async loadGameData(engine) {
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
            this.initializeRooms(engine, roomsData.rooms);
            this.initializeItems(engine, itemsData.items);
            this.initializeEnemies(engine, enemiesData.enemies);
            this.initializeQuests(engine, questsData.quests);
            this.initializeMazes(engine, mazesData.mazes);

            console.log('Items Map after initialization:', Array.from(engine.items.entries())); // Debug log

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

    initializeRooms(engine, roomsData) {
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
            engine.rooms.set(id, new engine.Room(id, data));
        }
    }

    initializeItems(engine, itemsData) {
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
            engine.items.set(id, new engine.Item(id, data));
        }

        console.log('Items Map after creation:', Array.from(engine.items.entries())); // Debug log
    }

    initializeEnemies(engine, enemiesData) {
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
            engine.enemies.set(id, new engine.Enemy(id, data));
        }
    }

    initializeQuests(engine, questsData) {
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
            engine.quests.set(id, new engine.Quest(id, data));
        }
    }

    initializeMazes(engine, mazesData) {
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
            engine.mazes.set(id, new engine.Maze(id, data));
        }
    }
}
