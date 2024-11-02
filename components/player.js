import { Bomb } from "./bomb.js";
import { PlayerLives } from './PlayerLives.js'; // Import PlayerLives class

export class Player {
    constructor(element, speed, gameMap, ws) { // Adding ws as a parameter
        this.element = element;
        this.speed = speed;
        this.gameMap = gameMap;
        this.ws = ws; // Storing ws for use in methods
        this.x = 0;
        this.y = 0;
        this.lives = 3;
        this.updatePosition();


        this.livesManager = new PlayerLives(3); // Initialize PlayerLives instance
        this.gameMap.addPlayer(this); // Add player to the map’s players array

        this.updatePosition();
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

    loseLife() {
        if (this.lives > 0) {
            this.lives -= 1;
            console.log(`Player lost a life. Lives remaining: ${this.lives}`);
            this.ws.send(JSON.stringify({ type: 'updateLives', playerIndex: this.index, lives: this.lives }));
        }
        if (this.lives === 0) {
            console.log("Player has no lives left.");
            // Handle player elimination or game over logic
        }
    }
}
