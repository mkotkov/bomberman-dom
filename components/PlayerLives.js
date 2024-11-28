// PlayerLives.js
export class PlayerLives {
    constructor(player, initialLives = 3) {
        this.player = player;
        this.lives = initialLives;
    }

    loseLife() {
        if (this.lives > 0) {
            this.lives--;
            this.updateDisplay();
        }
        return this.lives;
    }

    addLife() {
        this.lives++;
        this.updateDisplay();
    }

    setLives(lives) {
        this.lives = lives;
        this.updateDisplay();
    }

    isAlive() {
        return this.lives > 0;
    }

    resetLives(initialLives = 3) {
        this.lives = initialLives;
        this.updateDisplay();
    }

    getLives() {
        return this.lives;
    }

    updateDisplay() {
        this.player.updateLivesDisplay();
    }
}