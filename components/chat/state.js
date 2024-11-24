import { State } from '../../core/state.js';

export const chatState = new State({
    messages: [],
    connected: false,
    username: null
});