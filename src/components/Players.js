import { createElement } from '../core/dom.js';

export function renderPlayers(players) {
    return players
        .filter(player => player !== null) // Проверка на null
        .map(player => {
            const playerElement = createElement('div', {
                class: 'player',
                style: `top: ${player.y * 40}px; left: ${player.x * 40}px;`
            }, [player.name]);

            player.element = playerElement; // Сохраняем ссылку на DOM-элемент игрока
            return playerElement;
        });
}
