import { createElement } from "../core/dom.js";

export class Map {
    constructor(container) {
        this.container = container;
        this.tiles = [];
        this.mapData = this.generateMap();
        this.render();
    }

    generateMap() {
        // Генерация карты с фиксированными разрушаемыми стенами и случайными неразрушаемыми стенами
        const map = [
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 2, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ];

        // Случайная генерация неразрушаемых стен
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                // Генерируем неразрушаемую стену с вероятностью 10%
                if (Math.random() < 0.1 && map[i][j] === 0) {
                    map[i][j] = 2; // Неразрушаемая стена
                }
            }
        }
        return map;
    }

    render() {
        this.mapData.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileType = tile === 1 ? 'block' : tile === 2 ? 'wall' : tile === 0 ? 'grass' : 'empty';
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
            // Проходимыми считаются только пустые клетки (0)
            return this.mapData[row][col] === 0; // Проходимость только для травы
        }
        return false; // За пределами карты
    }

    canDestroyTile(col, row) {
        // Проверяем, можно ли разрушить тайл (только разрушаемые стены)
        return this.isWithinMapBounds(col, row) && this.mapData[row][col] === 1;
    }
}
