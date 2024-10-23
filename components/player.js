import { Bomb } from "./bomb.js";

export class Player {
    constructor(element, speed, gameMap) {
        this.element = element;
        this.speed = speed;
        this.gameMap = gameMap;
        this.x = 0;
        this.y = 0;
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
        new Bomb(col, row, 1, this.gameMap);
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
                return; // Если направление не распознано, выходим из функции
        }
    
        // Проверка границ карты и препятствий может быть здесь
        this.setPosition(newX, newY); // Обновляем позицию игрока
    }
    
}
