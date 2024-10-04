import { createElement } from '../core/dom.js';

export function WaitingPage(playerCount, timeLeft) {
    return createElement('div', { class: 'waiting-page' }, [
        createElement('h1', {}, ['Waiting for players...']),
        createElement('p', {}, [`Players connected: ${playerCount}/4`]),
        createElement('p', {}, [
            timeLeft > 0 ? `Game starts in: ${timeLeft}s` : 'Waiting for more players...'
        ])
    ]);
}
