import { Bomb } from "./bomb.js";

export class Player {
    constructor(element, speed, gameMap, ws, name, index) { // Adding ws as a parameter
        this.element = element;
        this.speed = speed;
        this.gameMap = gameMap;
        this.ws = ws; // Storing ws for use in methods
        this.name = name; // Player's name
        this.index = index; // Player's index
        this.color = this.getColorForIndex(index); // Assign color based on index

        // Stats
        this.lives = 3; // Placeholder for lives logic
        this.bombCount = 1; // Placeholder for bomb count logic
        this.explosionRange = 1; // Placeholder for explosion range logic

        this.x = 0;
        this.y = 0;
        this.updatePosition();
    }

    getColorForIndex(index) {
        const colors = ['red', 'blue', 'green', 'yellow'];
        return colors[index - 1];
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition();
    }

    placeBomb() {
        const col = Math.floor(this.x / 40);
        const row = Math.floor(this.y / 40);
        const bomb = new Bomb(col, row, 1, this.gameMap);

        // Sending bomb placement event to the server
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'placeBomb',
                position: { x: col, y: row }
            }));
        }
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    move(direction) {
        let newX = this.x;
        let newY = this.y;

        switch (direction) {
            case 'ArrowUp':
                newY -= this.speed;
                break;
            case 'ArrowDown':
                newY += this.speed;
                break;
            case 'ArrowLeft':
                newX -= this.speed;
                break;
            case 'ArrowRight':
                newX += this.speed;
                break;
            default:
                return;
        }
        
        if (this.gameMap.isPassable(newX, newY)) {
            this.setPosition(newX, newY);
        }
    }

    // Placeholder method for updating lives
    updateLives() {
      // Logic for updating player lives will go here
    }

    // Placeholder method for handling power-ups
    applyPowerUp(type) {
      // Logic for applying power-ups will go here
    }
}