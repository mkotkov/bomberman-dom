// components/PlayerLives.js

export class PlayerLives {
    constructor(initialLives = 3) {
        this.lives = initialLives; // Start each player with 3 lives
    }

    // Reduce lives by 1 and check if player is out
    loseLife() {
        if (this.lives > 0) {
            this.lives--;
        }
        return this.lives; // Return current lives after decrement
    }

    // Add a life (optional feature, e.g., for 1-Up power-up)
    addLife() {
        this.lives++;
    }

    // Check if player is still alive
    isAlive() {
        return this.lives > 0;
    }

    // Reset lives to the initial count
    resetLives(initialLives = 3) {
        this.lives = initialLives;
    }

    // Get current lives
    getLives() {
        return this.lives;
    }
}
