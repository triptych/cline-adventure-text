export class StateManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    startNewGame(engine) {
        // Create new player
        engine.player = new engine.Player({
            health: 100,
            maxHealth: 100,
            magic: 50,
            maxMagic: 50,
            level: 1,
            experience: 0,
            inventory: []
        });

        // Set starting room
        const startRoom = engine.rooms.get('start_room');
        if (startRoom) {
            engine.currentRoom = startRoom;
            // Mark starting room as explored
            engine.currentRoom.explore();
            console.log('Starting room items:', engine.currentRoom.items); // Debug log
        } else {
            console.error('No start room found!');
            return;
        }

        // Reset game state
        this.resetGameState(engine);

        // Trigger initial game events
        this.eventManager.emit('gameStarted');
        engine.playerActions.emitRoomEntered(engine);
        this.eventManager.emit('statsUpdated', engine.player.getStats());
        engine.playerActions.updateExploredRooms(engine, engine.currentRoom.id);
    }

    resetGameState(engine) {
        // Reset rooms
        engine.rooms.forEach(room => {
            if (typeof room.reset === 'function') {
                room.reset();
            }
        });

        // Reset quests
        engine.quests.forEach(quest => {
            if (typeof quest.reset === 'function') {
                quest.reset();
            }
        });

        // Reset enemies
        engine.enemies.forEach(enemy => {
            if (typeof enemy.reset === 'function') {
                enemy.reset();
            }
        });

        // Reset mazes
        engine.mazes.forEach(maze => {
            if (typeof maze.reset === 'function') {
                maze.reset();
            }
        });
    }

    getGameState(engine) {
        return {
            player: engine.player.serialize(),
            currentRoom: engine.currentRoom.id,
            exploredRooms: Array.from(engine.rooms.keys())
                .filter(id => engine.rooms.get(id).isExplored)
                .map(id => ({
                    id,
                    items: engine.rooms.get(id).items,
                    enemies: engine.rooms.get(id).enemies
                })),
            quests: Array.from(engine.quests.values())
                .map(quest => quest.serialize())
        };
    }

    loadGameState(engine, state) {
        // Restore player
        engine.player = new engine.Player(state.player);

        // Restore current room
        engine.currentRoom = engine.rooms.get(state.currentRoom);

        // Restore explored rooms
        state.exploredRooms.forEach(roomState => {
            const room = engine.rooms.get(roomState.id);
            room.isExplored = true;
            room.items = roomState.items;
            room.enemies = roomState.enemies;
        });

        // Restore quests
        state.quests.forEach(questState => {
            const quest = engine.quests.get(questState.id);
            quest.loadState(questState);
        });

        // Update UI
        this.eventManager.emit('gameLoaded');
        engine.playerActions.emitRoomEntered(engine);
        this.eventManager.emit('statsUpdated', engine.player.getStats());
        this.eventManager.emit('inventoryUpdated', engine.player.inventory);
        engine.playerActions.updateExploredRooms(engine, engine.currentRoom.id);
    }
}
