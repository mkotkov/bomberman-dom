import { createElement } from "../core/dom.js";

export class Map {
    constructor(container, mapData, ws) { // Добавляем ws как параметр конструктора
        this.container = container;
        this.mapData = mapData;
        this.ws = ws; // Сохраняем WebSocket для использования в методах
        this.tiles = [];
        this.render();
    }

    render() {
        this.tiles = []; // Очищаем массив тайлов

        this.mapData.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileType = tile === 1 ? 'block' : tile === 2 ? 'wall' : 'grass';
                const tileElement = createElement('div', {
                    class: `tile ${tileType}`,
                    style: {
                        left: `${colIndex * 40}px`,
                        top: `${rowIndex * 40}px`,
                    }
                });

                this.container.appendChild(tileElement);
                this.tiles.push(tileElement);
            });
        });
    }

    renderPlayer(playerIndex, x, y) {
        const existingPlayer = this.container.querySelector(`.player[data-index="${playerIndex}"]`);
        if (existingPlayer) {
            existingPlayer.style.left = `${x}px`;
            existingPlayer.style.top = `${y}px`;
        } else {
            const playerElement = createElement('div', {
                class: 'player',
                'data-index': playerIndex,
                style: {
                    left: `${x}px`,
                    top: `${y}px`,
                }
            });

            this.container.appendChild(playerElement);
        }
    }

    destroyWall(col, row) {
        if (this.canDestroyTile(col, row)) {
            this.mapData[row][col] = 0; // Обновляем карту на стороне клиента
            
            // Обновляем отображение на экране
            const tileIndex = row * this.mapData[0].length + col;
            if (this.tiles[tileIndex]) {
                this.tiles[tileIndex].classList.remove('block');
                this.tiles[tileIndex].classList.add('grass');
            }
            
            if (this.mapData[y][x] === 2) {
                this.mapData[y][x] = 0; // Изменяем на пустую клетку
                this.render(); // Перерисовываем карту
            }
            // Отправляем сообщение серверу о разрушении стены
            if (this.ws) {
                this.ws.send(JSON.stringify({
                    type: 'updateMap',
                    position: { x: col, y: row },
                    newValue: 0
                }));
            }
        }
    }

    isWithinMapBounds(col, row) {
        return row >= 0 && row < this.mapData.length && col >= 0 && col < this.mapData[row].length;
    }

    isTileWalkable(x, y) {
        const row = Math.floor(y / 40);
        const col = Math.floor(x / 40);
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0;
    }

    isPassable(x, y) {
        const col = Math.floor(x / 40);
        const row = Math.floor(y / 40);
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 0;
    }

    canDestroyTile(col, row) {
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1;
    }
}
