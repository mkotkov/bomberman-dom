export class Bomb {
    constructor(x, y, radius = 1, mapInstance) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.mapInstance = mapInstance;
        
        this.renderBomb();

        // Timer to trigger explosion after 3 seconds
        this.timer = setTimeout(() => this.explode(), 3000);
    }

    // Render the bomb on the map
    renderBomb() {
        const tileIndex = this.y * this.mapInstance.mapData[0].length + this.x;
        const bombElement = document.createElement('div');
        bombElement.classList.add('bomb');
        this.mapInstance.tiles[tileIndex].appendChild(bombElement);
        this.bombElement = bombElement;
    }

    // Handle explosion sequence
    explode() {
        this.bombElement.remove();

        // Create explosion effects in the bomb's initial location and in four directions
        this.createExplosionEffect(this.x, this.y);
        this.explodeInDirection(-1, 0);  // Left
        this.explodeInDirection(1, 0);   // Right
        this.explodeInDirection(0, -1);  // Up
        this.explodeInDirection(0, 1);   // Down

        // Check for any players within the explosion radius
        this.checkPlayerCollision();

        console.log(`Bomb exploded at (${this.x}, ${this.y}) with radius ${this.radius}`);

        clearTimeout(this.timer); // Clear the explosion timer
    }

    // Create explosion effect in a specific direction and apply damage to walls and players
    explodeInDirection(dx, dy) {
        for (let i = 1; i <= this.radius; i++) {
            const tileX = this.x + dx * i;
            const tileY = this.y + dy * i;

            // Check if the tile is within the map bounds
            if (this.mapInstance.isWithinMapBounds(tileX, tileY)) {
                this.createExplosionEffect(tileX, tileY);
                this.checkPlayerCollision(tileX, tileY);
            }

            // Stop if there's a destructible wall or an indestructible obstacle
            if (this.mapInstance.canDestroyTile(tileX, tileY)) {
                this.mapInstance.destroyWall(tileX, tileY);
                break; // Stop further explosion in this direction
            }
            if (this.mapInstance.mapData[tileY][tileX] === 2) {
                break; // Stop for indestructible obstacles
            }
        }
    }

    // Check for player collision within the explosion area and apply damage only once per explosion
    checkPlayerCollision(explosionX = this.x, explosionY = this.y) {
        const players = this.mapInstance.players;
        players.forEach(player => {
            const playerCol = Math.floor(player.x / 40);
            const playerRow = Math.floor(player.y / 40);

            // Check if player is at the explosion center or within explosion radius
            const inExplosionZone = (
                (playerCol === explosionX && playerRow === explosionY) || // Bomb center
                (Math.abs(playerCol - this.x) <= this.radius && Math.abs(playerRow - this.y) <= this.radius)
            );

            if (inExplosionZone && !player.hasTakenDamage) {
                player.loseLife();
                player.hasTakenDamage = true; // Prevent multiple life losses from the same explosion
            
                                // Notify the server about the life loss
                                if (player.ws) {
                                    player.ws.send(JSON.stringify({
                                        type: 'updateLives',
                                        playerIndex: player.index,
                                        lives: player.livesManager.getLives()
                                    }));
                                }
            }
        });
    
        // Reset damage flags for all players after the explosion
        setTimeout(() => {
            players.forEach(player => player.resetDamageFlag());
        }, 500);
    }


    // Create a temporary explosion visual effect at specified map coordinates
    createExplosionEffect(col, row) {
        const tileIndex = row * this.mapInstance.mapData[0].length + col;
        const tileElement = this.mapInstance.tiles[tileIndex];

        if (tileElement) {
            tileElement.classList.add('explosion'); // Add explosion effect

            // Remove the explosion effect after 500ms
            setTimeout(() => {
                tileElement.classList.remove('explosion');
            }, 500);
        }
    }
}
