import { createElement } from '../core/dom.js';

const BOMB_TIME = 2000; 

export function placeBomb(player, map, players, onExplosion) {
    const bombPosition = { x: player.x, y: player.y };
    const bombElement = createElement('div', { class: 'bomb' });
    bombElement.style.top = `${bombPosition.x * 40}px`;
    bombElement.style.left = `${bombPosition.y * 40}px`;

    document.querySelector('.game').appendChild(bombElement);

    setTimeout(() => {
        bombElement.remove();
        explodeBomb(bombPosition, map, players, onExplosion);
    }, BOMB_TIME);
}


function explodeBomb(position, map, players, onExplosion) {
    const directions = [
        { x: -1, y: 0 }, // Вверх
        { x: 1, y: 0 },  // Вниз
        { x: 0, y: -1 }, // Влево
        { x: 0, y: 1 }   // Вправо
    ];

    directions.forEach(({ x, y }) => {
        const targetX = position.x + x;
        const targetY = position.y + y;

        // Проверяем, есть ли игрок в этой позиции
        players.forEach(player => {
            if (player.x === targetX && player.y === targetY) {
                player.lives -= 1; // Уменьшаем жизни игрока
                updatePlayerDisplay(player); // Обновляем отображение жизней
                if (player.lives <= 0) {
                    // Логика выбытия игрока
                    alert(`Player ${player.name} has lost all lives!`);
                    player.element.remove(); // Удаляем элемент игрока
                }
            }
        });

        if (map[targetX] && map[targetX][targetY] === 'block') {
            map[targetX][targetY] = 'empty'; // Уничтожаем блок
            onExplosion(targetX, targetY);
        }
    
    });
}

function updatePlayerDisplay(player) {
    const playerElement = document.querySelector(`.player[data-id="${player.id}"]`);
    if (playerElement) {
        playerElement.textContent = `Lives: ${player.lives}`;
    }
}
