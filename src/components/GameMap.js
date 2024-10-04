import { createElement } from '../core/dom.js';

export const MAP_SIZE = 13; // Размер карты (например, 13x13)

export function generateBombermanMap(rows, cols, players) {
    // Создаем пустую карту
    const map = Array.from({ length: rows }, () => Array(cols).fill(0));
  
    // Размещаем неразрушаемые стены (пример: по краям карты и в шахматном порядке)
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (i === 0 || i === rows - 1 || j === 0 || j === cols - 1 || (i % 2 === 0 && j % 2 === 0)) {
          map[i][j] = 1; // неразрушаемая стена
        }
      }
    }
  
    // Размещаем разрушаемые блоки случайным образом
    for (let i = 1; i < rows - 1; i++) {
      for (let j = 1; j < cols - 1; j++) {
        if (map[i][j] === 0 && Math.random() > 0.7) { // 30% шанс появления блока
          map[i][j] = 2; // разрушаемый блок
        }
      }
    }
  
    // Определяем стартовые позиции игроков
    const playerPositions = [
      [1, 1],           // Верхний левый угол
      [1, cols - 2],    // Верхний правый угол
      [rows - 2, 1],    // Нижний левый угол
      [rows - 2, cols - 2] // Нижний правый угол
    ];
  
    // Размещаем игроков на карте
    for (let i = 0; i < players; i++) {
      const [row, col] = playerPositions[i];
      map[row][col] = 'P'; // Стартовая позиция игрока
      clearSurroundingArea(map, row, col); // Очищаем клетки рядом с игроком для безопасности
    }
  
    return map;
  }

// Создание игрового поля
export function GameMap(size = MAP_SIZE, players) {
    const map = generateBombermanMap(size, size, players);

    return createElement('div', { class: 'game-map' }, map.map((row, rowIndex) =>
        createElement('div', { class: 'row' }, row.map((cell, colIndex) =>
            createElement('div', { class: cell === 'P' ? 'player-cell' : cell === 1 ? 'wall' : cell === 2 ? 'destructible-block' : 'empty', id: `cell-${rowIndex}-${colIndex}` }) // Учитываем, что 'P' — это игрок
        ))
    ));
}

