import { createElement, renderElements } from '../../core/dom.js';
import { on } from '../../core/events.js';
import { chatState } from './state.js';
import { chatService } from './state.js';

export class Chat {
    constructor(container, ws) {
        this.container = container;
        this.ws = ws;
        this.setupUI();
        this.bindEvents();
        
        // Subscribe to state changes
        chatState.subscribe((state) => {
            this.renderMessages(state.messages);
        });
    }

    setupUI() { }
    bindEvents() { }
}


// export class Chat {
//     constructor() {
//         this.container = createElement('div', { class: 'chat' });
//         this.input = createElement('input', { type: 'text', placeholder: 'Enter your message' });
//         this.sendButton = createElement('button', { type: 'button', textContent: 'Send' });
//         this.messagesContainer = createElement('div', { class: 'messages' });
//         this.container.appendChild(this.input);
//         this.container.appendChild(this.sendButton);
//         this.container.appendChild(this.messagesContainer);
//         renderElements(document.body, this.container);
//         this.bindEvents();
//     }

//     bindEvents() {
//         on(this.sendButton, 'click', () => {
//             if (this.input.value) {
//                 chatService.sendMessage(this.input.value);
//                 this.input.value = '';
//             }
//         });
//     }

//     addMessage(message) {
//         const messageElement = createElement('div', { class: 'message', textContent: message });
//         this.messagesContainer.appendChild(messageElement);
//     }
// }   