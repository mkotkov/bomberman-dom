import { createElement, renderElements } from './core/dom.js';
import { State } from './core/state.js';
import { startGame } from './components/Game.js';

const socket = new WebSocket('ws://localhost:8080');
const state = new State({ playerCount: 0, players: [] });

// Обновляем список игроков и интерфейс ожидания
const updateWaitingPage = () => {
    const { playerCount, players } = state.getState();
    const playerNames = players
        .filter(player => player !== null && player.name) // Добавляем проверку на null и наличие имени
        .map(player => player.name)
        .join(', ');

    // Обновляем интерфейс ожидания
    renderElements(document.getElementById('app'), [
        createElement('div', {}, [
            createElement('h1', {}, [`Waiting for players... (${playerCount}/4)`]),
            createElement('p', {}, [`Players: ${playerNames}`]),
        ])
    ]);
};

state.subscribe(updateWaitingPage);

// Отслеживаем сообщения с сервера
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'playerCount') {
        state.setState({ playerCount: data.count });
    } else if (data.type === 'players') {
        state.setState({ players: data.players });  // Обновляем список игроков
    } else if (data.type === 'startGame') {
        startGame(state.getState().players);  // Начинаем игру с обновлённым списком игроков
    }
};

// Логика обработки присоединения игрока
const handleJoin = (nickname) => {
    if (!nickname) {
        alert('Please enter a nickname');
        return;
    }

    socket.send(JSON.stringify({ type: 'join', nickname }));
    updateWaitingPage();
};

renderElements(document.getElementById('app'), [
    createElement('div', {}, [
        createElement('h1', {}, ['Enter your nickname:']),
        createElement('input', { id: 'nickname-input', type: 'text' }, []),
        createElement('button', { id: 'join-btn' }, ['Join']),
    ])
]);

document.getElementById('join-btn').onclick = () => {
    const nickname = document.getElementById('nickname-input').value;
    handleJoin(nickname);
};
