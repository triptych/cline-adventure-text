export class Maze {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.description = data.description;
        this.width = data.grid_size.width;
        this.height = data.grid_size.height;
        this.startPosition = { ...data.start_position };
        this.endPosition = { ...data.end_position };
        this.layout = data.layout ? [...data.layout] : this.generateMaze();
        this.explored = new Set();
        this.currentPosition = { ...this.startPosition };
        this.items = new Map();
        this.enemies = new Map();
        this.traps = new Map();
        this.solved = false;
    }

    /**
     * Generate a random maze using depth-first search
     */
    generateMaze() {
        // Initialize grid with walls
        const grid = Array(this.height).fill().map(() =>
            Array(this.width).fill('wall')
        );

        const stack = [];
        const start = {
            x: Math.floor(Math.random() * Math.floor(this.width / 2)) * 2 + 1,
            y: Math.floor(Math.random() * Math.floor(this.height / 2)) * 2 + 1
        };

        grid[start.y][start.x] = 'path';
        stack.push(start);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current, grid);

            if (neighbors.length === 0) {
                stack.pop();
                continue;
            }

            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            const wallX = current.x + (next.x - current.x) / 2;
            const wallY = current.y + (next.y - current.y) / 2;

            grid[wallY][wallX] = 'path';
            grid[next.y][next.x] = 'path';
            stack.push(next);
        }

        // Set start and end positions
        grid[this.startPosition.y][this.startPosition.x] = 'start';
        grid[this.endPosition.y][this.endPosition.x] = 'end';

        return grid;
    }

    /**
     * Get unvisited neighbors for maze generation
     */
    getUnvisitedNeighbors(pos, grid) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -2 }, // North
            { x: 2, y: 0 },  // East
            { x: 0, y: 2 },  // South
            { x: -2, y: 0 }  // West
        ];

        for (const dir of directions) {
            const newX = pos.x + dir.x;
            const newY = pos.y + dir.y;

            if (newX > 0 && newX < this.width - 1 &&
                newY > 0 && newY < this.height - 1 &&
                grid[newY][newX] === 'wall') {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    /**
     * Move in a direction
     */
    move(direction) {
        const newPosition = { ...this.currentPosition };

        switch (direction) {
            case 'north':
                newPosition.y--;
                break;
            case 'south':
                newPosition.y++;
                break;
            case 'east':
                newPosition.x++;
                break;
            case 'west':
                newPosition.x--;
                break;
        }

        // Check if move is valid
        if (this.isValidMove(newPosition)) {
            this.currentPosition = newPosition;
            this.explored.add(`${newPosition.x},${newPosition.y}`);

            // Check if maze is solved
            if (this.isAtEnd()) {
                this.solved = true;
            }

            return {
                success: true,
                position: { ...this.currentPosition },
                cell: this.getCellType(newPosition),
                solved: this.solved
            };
        }

        return {
            success: false,
            message: "You can't move in that direction."
        };
    }

    /**
     * Check if a move is valid
     */
    isValidMove(position) {
        return position.x >= 0 &&
               position.x < this.width &&
               position.y >= 0 &&
               position.y < this.height &&
               this.layout[position.y][position.x] !== 'wall';
    }

    /**
     * Get the type of cell at a position
     */
    getCellType(position) {
        return this.layout[position.y][position.x];
    }

    /**
     * Check if current position is the end
     */
    isAtEnd() {
        return this.currentPosition.x === this.endPosition.x &&
               this.currentPosition.y === this.endPosition.y;
    }

    /**
     * Get available moves from current position
     */
    getAvailableMoves() {
        const moves = [];
        const directions = [
            { dir: 'north', dy: -1, dx: 0 },
            { dir: 'south', dy: 1, dx: 0 },
            { dir: 'east', dy: 0, dx: 1 },
            { dir: 'west', dy: 0, dx: -1 }
        ];

        for (const { dir, dy, dx } of directions) {
            const newPos = {
                x: this.currentPosition.x + dx,
                y: this.currentPosition.y + dy
            };
            if (this.isValidMove(newPos)) {
                moves.push(dir);
            }
        }

        return moves;
    }

    /**
     * Add an item to the maze
     */
    addItem(position, itemId) {
        const key = `${position.x},${position.y}`;
        if (!this.items.has(key)) {
            this.items.set(key, []);
        }
        this.items.get(key).push(itemId);
    }

    /**
     * Remove an item from the maze
     */
    removeItem(position, itemId) {
        const key = `${position.x},${position.y}`;
        const items = this.items.get(key);
        if (items) {
            const index = items.indexOf(itemId);
            if (index !== -1) {
                items.splice(index, 1);
                if (items.length === 0) {
                    this.items.delete(key);
                }
                return true;
            }
        }
        return false;
    }

    /**
     * Get items at current position
     */
    getItemsAtPosition() {
        const key = `${this.currentPosition.x},${this.currentPosition.y}`;
        return this.items.get(key) || [];
    }

    /**
     * Add an enemy to the maze
     */
    addEnemy(position, enemyId) {
        const key = `${position.x},${position.y}`;
        this.enemies.set(key, enemyId);
    }

    /**
     * Get enemy at current position
     */
    getEnemyAtPosition() {
        const key = `${this.currentPosition.x},${this.currentPosition.y}`;
        return this.enemies.get(key);
    }

    /**
     * Remove enemy from position
     */
    removeEnemy(position) {
        const key = `${position.x},${position.y}`;
        return this.enemies.delete(key);
    }

    /**
     * Get visible area around current position
     */
    getVisibleArea(radius = 1) {
        const visible = [];
        for (let y = -radius; y <= radius; y++) {
            for (let x = -radius; x <= radius; x++) {
                const pos = {
                    x: this.currentPosition.x + x,
                    y: this.currentPosition.y + y
                };

                if (pos.x >= 0 && pos.x < this.width &&
                    pos.y >= 0 && pos.y < this.height) {
                    visible.push({
                        x: pos.x,
                        y: pos.y,
                        type: this.layout[pos.y][pos.x]
                    });
                }
            }
        }
        return visible;
    }

    /**
     * Reset maze to initial state
     */
    reset() {
        this.currentPosition = { ...this.startPosition };
        this.explored.clear();
        this.solved = false;
        this.explored.add(`${this.startPosition.x},${this.startPosition.y}`);
    }

    /**
     * Serialize maze data for saving
     */
    serialize() {
        return {
            id: this.id,
            currentPosition: { ...this.currentPosition },
            explored: Array.from(this.explored),
            solved: this.solved,
            items: Array.from(this.items.entries()),
            enemies: Array.from(this.enemies.entries())
        };
    }

    /**
     * Load serialized maze data
     */
    loadState(data) {
        this.currentPosition = { ...data.currentPosition };
        this.explored = new Set(data.explored);
        this.solved = data.solved;

        this.items.clear();
        data.items.forEach(([key, items]) => {
            this.items.set(key, [...items]);
        });

        this.enemies.clear();
        data.enemies.forEach(([key, enemyId]) => {
            this.enemies.set(key, enemyId);
        });
    }
}
