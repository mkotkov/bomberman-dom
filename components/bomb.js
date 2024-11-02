export class Bomb {
    constructor(x, y, radius = 1, mapInstance) {
        this.x = x; // X position
        this.y = y; // Y position
        this.radius = radius; // Explosion radius
        this.mapInstance = mapInstance; // Reference to the map

        this.renderBomb(); // Render bomb on the map

        // Explosion timer
        this.timer = setTimeout(() => this.explode(), 3000);
    }

    renderBomb() {
        const tileIndex = this.y * this.mapInstance.mapData[0].length + this.x;
        const bombElement = document.createElement('div');
        bombElement.classList.add('bomb');
        this.mapInstance.tiles[tileIndex].appendChild(bombElement); // Display the bomb
        this.bombElement = bombElement;
    }

    explode() {
        // Remove bomb element
        this.bombElement.remove();

        // Explosion cross effect
        this.createExplosionEffect(this.x, this.y); // Center cell
        this.explodeInDirection(-1, 0); // Left
        this.explodeInDirection(1, 0);  // Right
        this.explodeInDirection(0, -1); // Up
        this.explodeInDirection(0, 1);  // Down

        this.checkPlayerCollision();

        console.log(`Bomb exploded at (${this.x}, ${this.y}) with radius ${this.radius}`);
        this.gameMap.players.forEach(player => {
            const distance = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            if (distance <= this.radius) {
                player.loseLife(); // Lose life if within explosion range
            }
        });
        // Clear timer
        clearTimeout(this.timer);
    }

    explodeInDirection(dx, dy) {
        for (let i = 1; i <= this.radius; i++) {
            const tileX = this.x + dx * i;
            const tileY = this.y + dy * i;

            // Add explosion effect
            if (this.mapInstance.isWithinMapBounds(tileX, tileY)) {
                this.createExplosionEffect(tileX, tileY);
                this.checkPlayerCollision(tileX, tileY); // Check for player in blast
            }

            // Destroy wall if destructible
            if (this.mapInstance.canDestroyTile(tileX, tileY)) {
                this.mapInstance.destroyWall(tileX, tileY);
                break; // Explosion doesn't continue through destroyed walls
            }

            // Stop explosion if it hits an indestructible wall
            if (this.mapInstance.mapData[tileY][tileX] === 2) {
                break;
            }
        }
    }

    checkPlayerCollision() {
        const players = this.mapInstance.players;

        if (!players || players.length === 0) {
            console.warn("No players available to check for collision.");
            return;
        }

        players.forEach(player => {
            const playerCol = Math.floor(player.x / 40);
            const playerRow = Math.floor(player.y / 40);

            if (
                (playerCol === this.x && playerRow === this.y) ||
                Math.abs(playerCol - this.x) <= this.radius && Math.abs(playerRow - this.y) <= this.radius
            ) {
                player.loseLife();
            }
        });
    }

    createExplosionEffect(col, row) {
        const tileIndex = row * this.mapInstance.mapData[0].length + col;
        const tileElement = this.mapInstance.tiles[tileIndex];

        if (tileElement) {
            tileElement.classList.add('explosion');

            setTimeout(() => {
                tileElement.classList.remove('explosion');
            }, 500);
        }
    }

    
}
