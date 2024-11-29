import { Bomb } from "./bomb.js";

export class Player {
    constructor(element, speed, gameMap, ws, name, index) {
        this.element = element; // HTML element representing the player
        this.speed = speed; // Player's movement speed
        this.gameMap = gameMap; // Reference to the game map
        this.ws = ws; // WebSocket for server communication
        this.name = name; // Player's name, used for identification and display
        this.index = index; // Player's index, used to assign unique properties like color
        this.color = this.getColorForIndex(index); // Assign a unique color based on the player's index

        // Stats
        this.lives = 3; // Placeholder for lives logic (to be implemented by teammates)
        this.bombCount = 1; // Placeholder for bomb count logic (to be implemented by teammates)
        this.explosionRange = 1; // Placeholder for explosion range logic (to be implemented by teammates)

        this.x = 0; // Initial x-coordinate position
        this.y = 0; // Initial y-coordinate position
        this.updatePosition(); // Update the player's position on the screen
    }

    getColorForIndex(index) {
        const colors = ['blue', 'red', 'green', 'yellow']; // Predefined colors for players
        return colors[index - 1]; // Return the color based on player's index (1-based)
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePosition(); // Update the player's position on the screen
    }

    placeBomb() {
        const col = Math.floor(this.x / 40); // Calculate column based on x-position
        const row = Math.floor(this.y / 40); // Calculate row based on y-position
        const bomb = new Bomb(col, row, 1, this.gameMap); // Create a new bomb at the player's position

        // Sending bomb placement event to the server
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'placeBomb',
                position: { x: col, y: row },
                radius: 1,
            }));

            this.ws.send(JSON.stringify({
                type: 'updatePlayerStats'
            }));
        }
        
    }

    updatePosition() {
        this.element.style.left = `${this.x}px`; // Update CSS left property for horizontal position
        this.element.style.top = `${this.y}px`; // Update CSS top property for vertical position
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
            this.setPosition(newX, newY); // Update position if the new location is passable
        }
    }

    
      // Placeholder method for handling power-ups
      applyPowerUp(type) {
        switch (type) {
            case 'speed':
                this.updateSpeed(this.speed + 1); // Пример: увеличиваем скорость
                break;
            case 'bombCount':
                this.updateBombCount(this.bombCount + 1); // Пример: увеличиваем количество бомб
                break;
            case 'explosionRange':
                this.updateExplosionRange(this.explosionRange + 1); // Пример: увеличиваем радиус взрыва
                break;
            default:
                console.warn("Unknown power-up type:", type);
        }
    
        if (this.ws) {
            this.ws.send(JSON.stringify({
                type: 'updatePlayerStats',
                stats: {
                    lives: this.lives,
                    bombCount: this.bombCount,
                    explosionRange: this.explosionRange,
                    speed: this.speed
                },
                playerIndex: this.index
            }));
        }
    }
    

      // Placeholder method for updating lives
    updateLives() {
        // Logic for updating player lives will go here
        // Example: decrease lives when hit by a bomb
        // if (hitByBomb) { 
        //     this.lives -= 1;
        // }
      }
  
      updateSpeed(newSpeed) {
        // Logic to update player speed will go here
        this.speed = newSpeed;
      }
  
      updateBombCount(newCount) {
        // Logic to update bomb count will go here
        this.bombCount = newCount;
      }
  
      updateExplosionRange(newRange) {
        // Logic to update explosion range will go here
        this.explosionRange = newRange;
      }
}