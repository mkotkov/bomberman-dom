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

    setupUI() {
        // Create main chat container
        this.chatContainer = createElement('div', {
            class: 'chat'
        });

        // Create messages container
        this.messagesContainer = createElement('div', {
            class: 'chat-messages'
        });

        // Create input container
        this.inputContainer = createElement('div', {
            class: 'chat-input'
        });

        // Create input field
        this.input = createElement('input', {
            type: 'text',
            placeholder: 'Type message...',
            class: 'chat-input-field'
        });

        // Create send button
        this.sendButton = createElement('button', {
            class: 'chat-send-button'
        });
        this.sendButton.textContent = 'Send';

        // Assemble the UI using the renderElements utility
        renderElements(this.inputContainer, [this.input, this.sendButton]);
        renderElements(this.chatContainer, [this.messagesContainer, this.inputContainer]);
        renderElements(this.container, [this.chatContainer]);
    }

    bindEvents() {
        // Use the event utility for event binding
        on(this.sendButton, 'click', () => this.sendMessage());
        
        on(this.input, 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;

        const chatMessage = {
            type: 'CHAT_MESSAGE',
            body: message,
            timestamp: Date.now()
        };

        this.ws.send(JSON.stringify(chatMessage));
        this.input.value = '';
    }
    
    handleMessage(message) {
        if (message.type !== 'CHAT_MESSAGE') return false;
        
        const currentState = chatState.getState();
        chatState.setState({
            messages: [...currentState.messages, message].slice(-100) // Keep last 100 messages
        });
        
        return true;
    }
    renderMessages(messages) {
        // Clear existing messages
        this.messagesContainer.innerHTML = '';

        // Create message elements
        const messageElements = messages.map(message => {
            return createElement('div', {
                class: 'message',
                innerHTML: `<span class="player">${message.creator}:</span> ${message.body}`
            });
        });

        // Render using the utility
        renderElements(this.messagesContainer, messageElements);
        
        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}
