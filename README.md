# Text Adventure Game Engine

A modern JavaScript-based text adventure game engine featuring a retro CRT display style. This engine provides a flexible framework for creating interactive text-based adventures with rich features and extensible gameplay mechanics.

## Features

- **Retro CRT Display**: Authentic retro-style display with CRT effects
- **Rich Game Engine**:
  - Event-driven architecture
  - State management system
  - Save/Load functionality
  - Data-driven game content
- **Game Elements**:
  - Player character system
  - Enemy encounters
  - Item management
  - Quest system
  - Maze navigation
  - Room-based exploration
- **Data-Driven Design**:
  - JSON-based content definition
  - Easily extendable game content
  - Modular entity system

## Project Structure

```
├── css/
│   ├── crt.css        # CRT display effects
│   └── style.css      # Core styling
├── data/
│   ├── enemies.json   # Enemy definitions
│   ├── items.json     # Item definitions
│   ├── mazes.json     # Maze layouts
│   ├── quests.json    # Quest definitions
│   └── rooms.json     # Room definitions
├── js/
│   ├── engine/        # Core game engine
│   │   ├── EventManager.js
│   │   ├── GameDataLoader.js
│   │   ├── GameEngine.js
│   │   ├── PlayerActions.js
│   │   ├── SaveManager.js
│   │   └── StateManager.js
│   ├── entities/      # Game entities
│   │   ├── Enemy.js
│   │   ├── Item.js
│   │   ├── Maze.js
│   │   ├── Player.js
│   │   ├── Quest.js
│   │   └── Room.js
│   ├── ui/
│   │   └── UIManager.js
│   └── main.js        # Application entry point
└── index.html         # Main HTML file
```

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Start your text adventure!

## Game Engine Architecture

The game engine is built with modularity and extensibility in mind:

- **GameEngine**: Central game loop and core mechanics
- **EventManager**: Handles game events and interactions
- **StateManager**: Manages game state and transitions
- **SaveManager**: Handles save/load functionality
- **GameDataLoader**: Loads and processes game data
- **UIManager**: Manages the user interface and display

## Customization

The game can be easily customized by modifying the JSON files in the `data/` directory:

- `enemies.json`: Define new enemies and their properties
- `items.json`: Create new items and their effects
- `mazes.json`: Design new maze layouts
- `quests.json`: Create new quests and objectives
- `rooms.json`: Define new rooms and their connections

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
