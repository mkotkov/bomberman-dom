import { createElement } from "../core/dom.js";

export class Map {
    constructor(container, mapData) {
        this.container = container;
        this.tiles = [];
        this.mapData = mapData;
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
        // Удаляем старый элемент игрока, если он уже существует
        const existingPlayer = this.container.querySelector(`.player[data-index="${playerIndex}"]`);
        if (existingPlayer) {
            existingPlayer.style.left = `${x}px`;
            existingPlayer.style.top = `${y}px`;
        } else {
            // Если игрока еще нет на карте, добавляем нового
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
        if (this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1) {
            console.log(`Destroying wall at (${col}, ${row})`);
            // Если тайл — разрушаемая стена
            this.mapData[row][col] = 0; // Удаляем стену (пустая клетка)
            
            // Находим соответствующий элемент на экране и меняем его класс на "трава"
            const tileIndex = row * this.mapData[0].length + col;
            if (this.tiles[tileIndex]) {
                console.log(`Tile index: ${tileIndex}, element found`);
                this.tiles[tileIndex].classList.remove('block');
                this.tiles[tileIndex].classList.add('grass'); // Меняем на пустой тайл (трава)
            } else {
                console.log(`Tile element not found at index: ${tileIndex}`);
            }
        } else {
            console.log(`Invalid wall destruction attempt at (${col}, ${row})`);
        }
    }
    
    isWithinMapBounds(col, row) {
        return row >= 0 && row < this.mapData.length && col >= 0 && col < this.mapData[row].length;
    }

    isTileWalkable(x, y) {
        const row = Math.floor(y / 40);
        const col = Math.floor(x / 40);
        if (this.isWithinMapBounds(col, row)) {
            return this.mapData[row][col] === 0; // Проходимость только для травы
        }
        return false; // За пределами карты
    }


    isPassable(x, y) {
        const col = Math.floor(x / 40);
        const row = Math.floor(y / 40);

        // Проверяем, находится ли клетка в пределах карты и является ли она проходимой
        if (row < 0 || row >= this.mapData.length || col < 0 || col >= this.mapData[row].length) {
            return false; // Вне границ карты
        }
        return this.mapData[row][col] === 0; // 0 - проходимая клетка, 1 - разрушаемая стена, 2 - неразрушаемая стена
    }

    canDestroyTile(col, row) {
        // Проверяем, можно ли разрушить тайл (только разрушаемые стены)
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1;
    }
}

