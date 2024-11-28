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


