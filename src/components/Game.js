import { createElement, renderElements} from '../core/dom.js';
import { on } from '../core/events.js';
import { renderPlayers } from './Players.js';
import { setupMovement } from './PlayerMovement.js';
import { placeBomb } from './Bombs.js';
import { renderPowerUps, generatePowerUps } from './PowerUps.js';
import { generateBombermanMap, GameMap, MAP_SIZE} from './GameMap.js';

function handleBombPlacement(player, map) {
    on(document, 'keydown', (event) => {
        if (event.key === ' ') { // Пробел для установки бомбы
            placeBomb(player, map, (x, y) => {
                const cell = document.querySelector(`.row:nth-child(${x + 1}) .cell:nth-child(${y + 1})`);
                if (cell) {
                    cell.classList.remove('block');
                    cell.classList.add('empty');
                }
            });
        }
    });
}

export function Game(players) {
    // Логируем массив игроков для отладки
    console.log("Players in Game:", players);

    const map = generateBombermanMap(players.length);
    const powerUps = generatePowerUps(map);
    const playerElements = renderPlayers(players);

    playerElements.forEach((playerElement, index) => {
        // Проверяем, что игрок не null
        if (players[index]) {
            players[index].element = playerElement;
            setupMovement(players[index], map, powerUps);
            handleBombPlacement(players[index], map);
        } else {
            console.warn(`Player at index ${index} is null or undefined`);
        }
    });

    checkForWinner(players);

    return createElement('div', { class: 'game' }, [
        GameMap(MAP_SIZE, players),
        ...playerElements,
        ...powerUps
    ]);
}

export function startGame(players) {
    console.log("Starting game with players:", players); // Логируем переданные данные
    renderElements(document.getElementById('app'), [
        Game(players)
    ]);
}

function checkForWinner(players) {
    const alivePlayers = players.filter(player => player && player.lives > 0); // Проверяем, что игрок не null
    if (alivePlayers.length === 1) {
        alert(`Player ${alivePlayers[0].name} wins!`);
    }
}
