import { Player } from '../entities/Player.js';
import { Room } from '../entities/Room.js';
import { Enemy } from '../entities/Enemy.js';
import { Item } from '../entities/Item.js';
import { Quest } from '../entities/Quest.js';
import { Maze } from '../entities/Maze.js';
import { GameDataLoader } from './GameDataLoader.js';
import { PlayerActions } from './PlayerActions.js';
import { StateManager } from './StateManager.js';

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

        // Initialize sub-modules
        this.dataLoader = new GameDataLoader(eventManager);
        this.playerActions = new PlayerActions(eventManager);
        this.stateManager = new StateManager(eventManager);

        // Make entity classes available to sub-modules
        this.Player = Player;
        this.Room = Room;
        this.Enemy = Enemy;
        this.Item = Item;
        this.Quest = Quest;
        this.Maze = Maze;
    }

    async loadGameData() {
        await this.dataLoader.loadGameData(this);
    }

    startNewGame() {
        this.stateManager.startNewGame(this);
    }

    movePlayer(direction) {
        this.playerActions.movePlayer(this, direction);
    }

    performAction(action) {
        this.playerActions.performAction(this, action);
    }

    getGameState() {
        return this.stateManager.getGameState(this);
    }

    loadGameState(state) {
        this.stateManager.loadGameState(this, state);
    }
}
