import { createElement } from '../core/dom.js';

export class Chat {
    constructor(url) {
        this.socket = new WebSocket(url);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    onMessage(event) {
        const message = JSON.parse(event.data);
        this.displayMessage(message);
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify(message));
    }

    displayMessage(message) {
        const chatBox = document.querySelector('.chat-box');
        chatBox.innerHTML += `<div>${message.username}: ${message.text}</div>`;
    }
}

export function ChatComponent() {
    const chatElement = createElement('div', { class: 'chat' }, [
        createElement('div', { class: 'chat-box' }),
        createElement('input', { type: 'text', placeholder: 'Enter message...' }),
        createElement('button', { class: 'send-button' }, ['Send'])
    ]);

    const input = chatElement.querySelector('input');
    const sendButton = chatElement.querySelector('.send-button');

    sendButton.addEventListener('click', () => {
        const message = { username: 'Player', text: input.value };
        chat.sendMessage(message);
        input.value = '';
    });

    return chatElement;
}
