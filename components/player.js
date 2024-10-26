import { Bomb } from "./bomb.js";

export class Player {
    constructor(element, speed, gameMap, ws) { // Добавляем ws как параметр
        this.element = element;
        this.speed = speed;
        this.gameMap = gameMap;
        this.ws = ws; // Сохраняем ws для использования в методах
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
        const bomb = new Bomb(col, row, 1, this.gameMap);

        // Отправляем событие установки бомбы на сервер
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
            const oldPosition = { x: this.x, y: this.y };
            this.setPosition(newX, newY);

            // Отправляем событие перемещения на сервер
            if (this.ws && (oldPosition.x !== this.x || oldPosition.y !== this.y)) {
                this.ws.send(JSON.stringify({
                    type: 'movePlayer',
                    newPosition: { x: this.x, y: this.y }
                }));
            }
        }
    }
}
