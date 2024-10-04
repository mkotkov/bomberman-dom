import { createElement } from '../core/framework';

export function JoinPage(onJoin) {
    let playerName = '';

    const handleInputChange = (event) => {
        playerName = event.target.value;
    };

    const handleJoinClick = () => {
        if (playerName) {
            onJoin(playerName);
        }
    };

    return createElement('div', { className: 'join-page' }, 
        createElement('h1', null, 'Enter your nickname'),
        createElement('input', { type: 'text', onInput: handleInputChange }),
        createElement('button', { onClick: handleJoinClick }, 'Join Game')
    );
}
