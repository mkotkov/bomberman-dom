export class Bomb {
    constructor(x, y, radius = 1, mapInstance) {
        this.x = x; // Позиция по X
        this.y = y; // Позиция по Y
        this.radius = radius; // Радиус взрыва
        this.mapInstance = mapInstance; // Ссылка на карту

        this.renderBomb(); // Отображение бомбы на карте

        // Таймер взрыва
        this.timer = setTimeout(() => this.explode(), 3000);
    }

    renderBomb() {
        const tileIndex = this.y * this.mapInstance.mapData[0].length + this.x;
        const bombElement = document.createElement('div');
        bombElement.classList.add('bomb');
        this.mapInstance.tiles[tileIndex].appendChild(bombElement); // Отображаем бомбу
        this.bombElement = bombElement;
    }

    explode() {
        // Удаление элемента бомбы
        this.bombElement.remove();

        // Взрыв крестом
        this.createExplosionEffect(this.x, this.y); // Центральная клетка
        this.explodeInDirection(-1, 0); // Влево
        this.explodeInDirection(1, 0);  // Вправо
        this.explodeInDirection(0, -1); // Вверх
        this.explodeInDirection(0, 1);  // Вниз

        // Очистка таймера
        clearTimeout(this.timer);
    }

    explodeInDirection(dx, dy) {
        for (let i = 1; i <= this.radius; i++) {
            const tileX = this.x + dx * i;
            const tileY = this.y + dy * i;

            // Добавляем эффект взрыва
            if (this.mapInstance.isWithinMapBounds(tileX, tileY)) {
                this.createExplosionEffect(tileX, tileY);
            }

            // Разрушаем стену, если она разрушаемая
            if (this.mapInstance.canDestroyTile(tileX, tileY)) {
                this.mapInstance.destroyWall(tileX, tileY);
                break; // Взрыв не проходит дальше через разрушённые стены
            }

            // Прекращаем взрыв при попадании на неразрушаемую стену
            if (this.mapInstance.mapData[tileY][tileX] === 2) {
                break;
            }
        }
    }

    createExplosionEffect(col, row) {
        const tileIndex = row * this.mapInstance.mapData[0].length + col;
        const tileElement = this.mapInstance.tiles[tileIndex];

        if (tileElement) {
            tileElement.classList.add('explosion');

            setTimeout(() => {
                tileElement.classList.remove('explosion');
            }, 500);
        }
    }
}
