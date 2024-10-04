export class State {
    constructor(initialState) {
      this.state = initialState;
      this.listeners = [];
    }
  
    getState() {
      return this.state;
    }
  
    setState(newState) {
      this.state = { ...this.state, ...newState };
      this.listeners.forEach(listener => listener(this.state));
    }
  
    subscribe(listener) {
      this.listeners.push(listener);
    }
  }
  