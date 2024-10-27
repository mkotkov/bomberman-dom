import { createElement } from "../core/dom.js";

export class Map {
    constructor(container, mapData, ws) { // Adding ws as a parameter to the constructor
        this.container = container;
        this.mapData = mapData;
        this.ws = ws; // Storing WebSocket for use in methods
        this.tiles = [];
        this.render(); // Initial rendering of the map
    }

    render() {
        this.tiles = []; // Clear the tiles array

        // Iterate over each row and column in the map data
        this.mapData.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                // Determine the tile type based on the map data value
                const tileType = tile === 1 ? 'block' : tile === 2 ? 'wall' : 'grass';
                const tileElement = createElement('div', {
                    class: `tile ${tileType}`,
                    style: {
                        left: `${colIndex * 40}px`, // Positioning based on column index
                        top: `${rowIndex * 40}px`,   // Positioning based on row index
                    }
                });

                this.container.appendChild(tileElement); // Add tile to the container
                this.tiles.push(tileElement); // Track tile element
            });
        });
    }

    renderPlayer(playerIndex, x, y) {
        const existingPlayer = this.container.querySelector(`.player[data-index="${playerIndex}"]`);
        if (existingPlayer) {
            // Update position if player already exists
            existingPlayer.style.left = `${x}px`;
            existingPlayer.style.top = `${y}px`;
        } else {
            // Create new player element
            const playerElement = createElement('div', {
                class: 'player',
                'data-index': playerIndex,
                style: {
                    left: `${x}px`,
                    top: `${y}px`,
                }
            });

            this.container.appendChild(playerElement); // Add new player to the container
        }
    }

    destroyWall(col, row) {
        if (this.canDestroyTile(col, row)) {
            this.mapData[row][col] = 0; // Update the map on the client side
            
            // Update display on the screen
            const tileIndex = row * this.mapData[0].length + col;
            if (this.tiles[tileIndex]) {
                this.tiles[tileIndex].classList.remove('block'); // Change tile class
                this.tiles[tileIndex].classList.add('grass'); // Set new tile type
            }
            
            if (this.mapData[row][col] === 2) {
                this.mapData[row][col] = 0; // Change to empty tile
                this.render(); // Re-render the map
            }
            
            // Send a message to the server about the wall destruction
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'updateMap',
                    position: { x: col, y: row },
                    newValue: 0 // New value after destruction
                }));
            }
        }
    }

    isWithinMapBounds(col, row) {
        return row >= 0 && row < this.mapData.length && col >= 0 && col < this.mapData[row].length;
    }

    isTileWalkable(x, y) {
        const row = Math.floor(y / 40); // Calculate row based on y position
        const col = Math.floor(x / 40); // Calculate column based on x position
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0; // Check if tile is walkable
    }

    isPassable(x, y) {
        const col = Math.floor(x / 40); // Calculate column based on x position
        const row = Math.floor(y / 40); // Calculate row based on y position
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0; // Check if tile is passable
    }

    canDestroyTile(col, row) {
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1; // Check if tile can be destroyed
    }
}
