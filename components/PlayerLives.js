// PlayerLives.js
export class PlayerLives {
    constructor(initialLives = 3, updateCallback) {
        this.lives = initialLives;
        this.updateCallback = updateCallback; // Store the callback function
    }

    loseLife() {
        if (this.lives > 0) {
            this.lives--;
        }
        // Call the callback with updated lives
        if (this.updateCallback) {
            this.updateCallback(this.lives);
        }
        return this.lives;
    }

    addLife() {
        this.lives++;
        // Call the callback with updated lives
        if (this.updateCallback) {
            this.updateCallback(this.lives);
        }
    }

    isAlive() {
        return this.lives > 0;
    }

    resetLives(initialLives = 3) {
        this.lives = initialLives;
        // Call the callback with updated lives
        if (this.updateCallback) {
            this.updateCallback(this.lives);
        }
    }

    getLives() {
        return this.lives;
    }
}
