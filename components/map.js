import { createElement } from "../core/dom.js";

export class Map {
    constructor(container, mapData, ws) {
        this.container = container;
        this.mapData = mapData;
        this.ws = ws;
        this.tiles = [];
        this.boosts = []; // Array to track boosts on the map
        this.render(); // Initial rendering of the map
    }

    render() {
        this.container.innerHTML = ''; // Clear the container
        this.tiles = []; // Reset the tiles array

        this.mapData.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileType = tile === 1 ? 'block' : tile === 2 ? 'wall' : 'grass';
                const tileElement = createElement('div', {
                    class: `tile ${tileType}`,
                    style: {
                        left: `${colIndex * 40}px`,
                        top: `${rowIndex * 40}px`,
                    }
                });

                this.container.appendChild(tileElement);
                this.tiles.push(tileElement);
            });
        });

        // Render boosts explicitly
        this.boosts.forEach(boost => {
            this.renderBoost(boost);
        });
    }

    renderPlayer(playerIndex, x, y) {
        const existingPlayer = this.container.querySelector(`.player[data-index="${playerIndex}"]`);
        if (existingPlayer) {
            existingPlayer.style.left = `${x}px`;
            existingPlayer.style.top = `${y}px`;
        } else {
            const playerElement = createElement('div', {
                class: 'player',
                'data-index': playerIndex,
                style: {
                    left: `${x}px`,
                    top: `${y}px`,
                }
            });

            this.container.appendChild(playerElement);
        }

        // Check if player landed on a boost
        const boost = this.boosts.find(boost => boost.x * 40 === x && boost.y * 40 === y);
        if (boost) {
            this.collectBoost(playerIndex, boost);
        }
    }

    destroyWall(col, row) {
        if (this.canDestroyTile(col, row)) {
            this.mapData[row][col] = 0;

            const tileIndex = row * this.mapData[0].length + col;
            if (this.tiles[tileIndex]) {
                this.tiles[tileIndex].classList.remove('block');
                this.tiles[tileIndex].classList.add('grass');
            }

            // Log the boost-spawn condition
            if (Math.random() < 0.3) {
                console.log('Attempting to spawn boost...');
                this.spawnBoost(col, row);
            }

            // No need to call this.render() immediately, optimize to re-render only the relevant parts
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'updateMap',
                    position: { x: col, y: row },
                    newValue: 0
                }));
            }
        }
    }

    spawnBoost(x, y) {
        const boostTypes = ['speed', 'range', 'bomb'];
        const boostType = boostTypes[Math.floor(Math.random() * boostTypes.length)];
        const boost = { x, y, type: boostType, id: `${x}-${y}-${boostType}` }; // Add unique ID to each boost

        this.boosts.push(boost); // Add the boost to the boosts array
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'boostSpawned', boost }));
        }
        this.renderBoost(boost); // Render the new boost
    }

    renderBoost(boost) {
        const boostElement = createElement('div', {
            class: `boost ${boost.type}`,
            'data-boost-id': boost.id, // Add the boost id for unique identification
            style: {
                left: `${boost.x * 40}px`,
                top: `${boost.y * 40}px`,
            }
        });
        this.container.appendChild(boostElement);
    }

    collectBoost(playerIndex, boost) {
        this.boosts = this.boosts.filter(b => b !== boost); // Remove boost from map
        if (this.ws) {
            this.ws.send(JSON.stringify({ type: 'boostCollected', playerIndex, boost }));
        }
        // Instead of re-rendering the whole map, just remove the boost element from the DOM
        const boostElement = this.container.querySelector(`.boost[data-boost-id="${boost.id}"]`);
        if (boostElement) {
            boostElement.remove();
        }
    }

    isWithinMapBounds(col, row) {
        return row >= 0 && row < this.mapData.length && col >= 0 && col < this.mapData[row].length;
    }

    isTileWalkable(x, y) {
        const row = Math.floor(y / 40);
        const col = Math.floor(x / 40);
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0;
    }

    isPassable(x, y) {
        const col = Math.floor(x / 40);
        const row = Math.floor(y / 40);
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0;
    }

    canDestroyTile(col, row) {
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1;
    }
}
