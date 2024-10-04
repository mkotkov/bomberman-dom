import { on } from '../core/events.js';

const KEY_CODES = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right'
};

const DIRECTIONS = {
    up: { x: -1, y: 0 },
    down: { x: 1, y: 0 },
    left: { x: 0, y: -1 },
    right: { x: 0, y: 1 }
};

function canMove(map, x, y) {
    return map[x] && map[x][y] !== 'wall' && map[x][y] !== 'block';
}

export function setupMovement(player, map, powerUps) {
    const handleMovement = (event) => {
        const { key } = event;
        let newX = player.x;
        let newY = player.y;

        switch (key) {
            case 'ArrowUp':
                newX -= 1;
                break;
            case 'ArrowDown':
                newX += 1;
                break;
            case 'ArrowLeft':
                newY -= 1;
                break;
            case 'ArrowRight':
                newY += 1;
                break;
        }

        if (map[newX] && map[newX][newY] === 'empty') {
            player.x = newX;
            player.y = newY;
            player.element.style.top = `${newX * 40}px`;
            player.element.style.left = `${newY * 40}px`;

            // Проверка на взаимодействие с power-ups
            powerUps.forEach((powerUp, index) => {
                if (powerUp.x === newX && powerUp.y === newY) {
                    applyPowerUp(player, powerUp); // Применяем бонус
                    powerUps.splice(index, 1); // Удаляем использованный power-up
                    renderPowerUps(powerUps); // Обновляем отображение power-ups
                }
            });
        }
    };

    on(player.element, 'keydown', handleMovement);
}

function applyPowerUp(player, powerUp) {
    switch (powerUp.type) {
        case 'speed':
            player.speed += 1; // Увеличиваем скорость игрока
            break;
        case 'bomb':
            player.bombPower += 1; // Увеличиваем мощность бомбы
            break;
        case 'life':
            player.lives += 1; // Добавляем жизнь
            break;
    }
    updatePlayerDisplay(player); // Обновляем отображение игрока
}

