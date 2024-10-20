export class Bomb {
    constructor(x, y, radius = 1, mapInstance) {
        this.x = x; // Позиция по X
        this.y = y; // Позиция по Y
        this.radius = radius; // Радиус взрыва
        this.mapInstance = mapInstance; // Ссылка на карту
        this.timer = setTimeout(() => this.explode(), 3000); // Взрыв через 3 секунды
    }

    explode() {
        for (let i = -this.radius; i <= this.radius; i++) {
            for (let j = -this.radius; j <= this.radius; j++) {
                const tileX = this.x + i;
                const tileY = this.y + j;

                // Добавляем эффект взрыва
                this.createExplosionEffect(tileX, tileY);

                // Разрушаем стены на карте, если это разрушаемая стена
                if (this.mapInstance.canDestroyTile(tileX, tileY)) {
                    this.mapInstance.destroyWall(tileX, tileY);
                }
            }
        }

        // Очистка таймера
        clearTimeout(this.timer);
    }

    createExplosionEffect(col, row) {
        const tileIndex = row * this.mapInstance.mapData[0].length + col;
        const tileElement = this.mapInstance.tiles[tileIndex];

        if (tileElement) {
            // Добавляем класс взрыва
            tileElement.classList.add('explosion');

            // Удаляем эффект взрыва через 0.5 секунды
            setTimeout(() => {
                tileElement.classList.remove('explosion');
            }, 500);
        }
    }
}
