import { GameEngine } from './engine/GameEngine.js';
import { UIManager } from './ui/UIManager.js';
import { EventManager } from './engine/EventManager.js';
import { SaveManager } from './engine/SaveManager.js';

class Game {
    constructor() {
        this.eventManager = new EventManager();
        this.engine = new GameEngine(this.eventManager);
        this.ui = new UIManager(this.eventManager);
        this.saveManager = new SaveManager(this.engine, this.eventManager);

        this.initialize();
    }

    initialize() {
        // Initialize event listeners
        this.setupEventListeners();

        // Load game data
        this.engine.loadGameData().then(() => {
            // Start new game
            this.engine.startNewGame();

            // Initial UI update
            this.ui.refreshDisplay();
        }).catch(error => {
            console.error('Failed to load game data:', error);
            this.ui.displayError('Failed to load game data. Please refresh the page.');
        });
    }

    setupEventListeners() {
        // Direction controls
        document.querySelectorAll('.dir-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const direction = e.target.dataset.direction;
                this.engine.movePlayer(direction);
            });
        });

        // Action controls
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.engine.performAction(action);
            });
        });

        // Game controls
        document.querySelectorAll('.game-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'new':
                        if (confirm('Start a new game? Current progress will be lost.')) {
                            this.engine.startNewGame();
                        }
                        break;
                    case 'save':
                        this.saveManager.saveGame();
                        break;
                    case 'load':
                        if (confirm('Load last save? Current progress will be lost.')) {
                            this.saveManager.loadGame();
                        }
                        break;
                }
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.engine.movePlayer('north');
                    break;
                case 's':
                case 'arrowdown':
                    this.engine.movePlayer('south');
                    break;
                case 'a':
                case 'arrowleft':
                    this.engine.movePlayer('west');
                    break;
                case 'd':
                case 'arrowright':
                    this.engine.movePlayer('east');
                    break;
                case 'l':
                    this.engine.performAction('look');
                    break;
                case 't':
                    this.engine.performAction('take');
                    break;
                case 'u':
                    this.engine.performAction('use');
                    break;
                case 'k':
                    this.engine.performAction('talk');
                    break;
            }
        });
    }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
