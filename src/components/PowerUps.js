import { createElement } from '../core/dom.js';

const POWER_UPS = [
    { type: 'speed', label: 'Speed Boost' },
    { type: 'bomb', label: 'Increase Bomb Power' },
    { type: 'life', label: 'Extra Life' }
];

export function generatePowerUps(map) {
    const powerUps = [];

    // Генерируем power-ups на случайных пустых клетках карты
    map.forEach((row, x) => {
        row.forEach((cell, y) => {
            if (cell === 'empty' && Math.random() < 0.1) { // 10% шанс появления power-up
                const powerUp = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
                powerUps.push({ x, y, type: powerUp.type });
                map[x][y] = 'power-up'; // Помечаем клетку как занято power-up
            }
        });
    });

    return powerUps;
}

export function renderPowerUps(powerUps) {
    return powerUps.map(powerUp => {
        const powerUpElement = createElement('div', { class: 'power-up' });
        powerUpElement.style.top = `${powerUp.x * 40}px`;
        powerUpElement.style.left = `${powerUp.y * 40}px`;
        powerUpElement.textContent = powerUp.type;
        return powerUpElement;
    });
}
