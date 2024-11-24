export class PlayerActions {
    constructor(eventManager) {
        this.eventManager = eventManager;
    }

    movePlayer(engine, direction) {
        const nextRoomId = engine.currentRoom.exits[direction];

        if (!nextRoomId) {
            this.eventManager.emit('message', "You can't go that way.");
            return;
        }

        const nextRoom = engine.rooms.get(nextRoomId);

        // Check if room has requirements
        if (nextRoom.requirements) {
            if (!this.checkRoomRequirements(engine, nextRoom.requirements)) {
                return;
            }
        }

        engine.currentRoom = nextRoom;
        // Mark the room as explored when entering
        engine.currentRoom.explore();
        this.emitRoomEntered(engine);
        this.updateExploredRooms(engine, nextRoomId);
    }

    checkRoomRequirements(engine, requirements) {
        if (requirements.item && !engine.player.hasItem(requirements.item)) {
            const item = engine.items.get(requirements.item);
            this.eventManager.emit('message', `You need ${item.name} to enter this room.`);
            return false;
        }

        if (requirements.quest && !engine.quests.get(requirements.quest).isCompleted()) {
            const quest = engine.quests.get(requirements.quest);
            this.eventManager.emit('message', `You must complete "${quest.title}" to enter this room.`);
            return false;
        }

        return true;
    }

    performAction(engine, action) {
        switch (action) {
            case 'look':
                this.lookAround(engine);
                break;
            case 'take':
                this.takeItem(engine);
                break;
            case 'use':
                this.useItem(engine);
                break;
            case 'talk':
                this.talkToNPC(engine);
                break;
        }
    }

    lookAround(engine) {
        const description = engine.currentRoom.getDescription();
        console.log('Looking around room with items:', engine.currentRoom.items); // Debug log

        const items = engine.currentRoom.items
            .map(id => {
                const item = engine.items.get(id);
                console.log(`Looking up item with id: ${id}, found:`, item); // Debug log
                return item ? item.name : null;
            })
            .filter(name => name !== null)
            .join(', ');

        const enemies = engine.currentRoom.enemies
            .map(id => {
                const enemy = engine.enemies.get(id);
                return enemy ? enemy.name : null;
            })
            .filter(name => name !== null)
            .join(', ');

        let message = description;
        if (items) message += `\nYou see: ${items}`;
        if (enemies) message += `\nEnemies present: ${enemies}`;

        this.eventManager.emit('message', message);
    }

    takeItem(engine) {
        if (!engine.currentRoom.items.length) {
            this.eventManager.emit('message', "There's nothing here to take.");
            return;
        }

        // For simplicity, take the first item in the room
        const itemId = engine.currentRoom.items[0];
        const item = engine.items.get(itemId);

        if (!item) {
            console.error(`Item ${itemId} not found in items map`);
            return;
        }

        engine.player.addItem(itemId);
        engine.currentRoom.removeItem(itemId);

        this.eventManager.emit('message', `You took the ${item.name}.`);
        this.eventManager.emit('inventoryUpdated', engine.player.inventory);
        // Re-emit room entered to update item list
        this.emitRoomEntered(engine);
    }

    useItem(engine) {
        if (!engine.player.inventory.length) {
            this.eventManager.emit('message', "You don't have any items to use.");
            return;
        }

        // For simplicity, use the first item in inventory
        const itemId = engine.player.inventory[0];
        const item = engine.items.get(itemId);

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
            engine.player.applyEffects(item.effects);
            engine.player.removeItem(itemId);
            this.eventManager.emit('message', `You used the ${item.name}.`);
            this.eventManager.emit('statsUpdated', engine.player.getStats());
            this.eventManager.emit('inventoryUpdated', engine.player.inventory);
        }
    }

    talkToNPC(engine) {
        // Implement NPC dialogue system
        this.eventManager.emit('message', "There's no one here to talk to.");
    }

    emitRoomEntered(engine) {
        console.log('Current room items before mapping:', engine.currentRoom.items); // Debug log
        console.log('Items Map contents:', Array.from(engine.items.entries())); // Debug log

        // Get item names for items in the room
        const itemNames = engine.currentRoom.items
            .map(itemId => {
                const item = engine.items.get(itemId);
                console.log(`Looking up item with id: ${itemId}, found:`, item); // Debug log
                return item ? { id: itemId, name: item.name } : null;
            })
            .filter(item => item !== null); // Filter out any null items

        console.log('Resolved item names:', itemNames); // Debug log

        // Create room data with item names
        const roomData = {
            room: engine.currentRoom,
            itemNames: itemNames
        };

        // Emit room entered event
        this.eventManager.emit('roomEntered', roomData);
    }

    updateExploredRooms(engine, roomId) {
        // Update map with all explored rooms
        this.eventManager.emit('mapUpdated', {
            currentRoom: roomId,
            exploredRooms: Array.from(engine.rooms.keys())
                .filter(id => engine.rooms.get(id).isExplored)
        });
    }
}
