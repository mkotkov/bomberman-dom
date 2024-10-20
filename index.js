import { Player } from './components/player.js';
import { Map } from './components/map.js';
import {on} from './core/events.js'

const gameContainer = document.getElementById('game');
const playerElement = document.getElementById('player');
const playerSpeed = 40; // Скорость перемещения игрока

const gameMap = new Map(gameContainer);
const player = new Player(playerElement, playerSpeed, gameMap);

on(document,'keydown', (event) => {
    player.move(event.key);
    if (event.key === ' ') { 
        player.placeBomb();
    }
});



// Начальная позиция игрока
player.updatePosition();
