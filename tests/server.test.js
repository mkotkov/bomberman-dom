const WebSocket = require('ws');
const http = require('http');

describe('Bomberman WebSocket Server', () => {
  let server;
  let client;
  jest.setTimeout(10000);

  beforeAll((done) => {
    server = require('../server'); // Adjust the path to your server file
  setTimeout(done, 1000); // Give the server time to start
    server = http.createServer();
    server.listen(8080, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  beforeEach((done) => {
    client = new WebSocket('ws://localhost:8080');
    client.on('open', done);
    client.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      done(error);
    });
  });

  afterEach(() => {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });

  test('should create or join a game session', (done) => {
    client.send(JSON.stringify({ type: 'createOrJoinGame' }));
    client.on('message', (message) => {
      const data = JSON.parse(message);
      expect(data.type).toMatch(/gameCreated|joinedExistingGame/);
      expect(data.sessionId).toBeDefined();
      expect(data.map).toBeDefined();
      done();
    });
  });

  test('should handle player movement', (done) => {
    const newPosition = { x: 80, y: 80 };
    client.send(JSON.stringify({ type: 'movePlayer', newPosition }));
    client.on('message', (message) => {
      const data = JSON.parse(message);
      expect(data.type).toBe('updatePlayerPosition');
      expect(data.position).toEqual(newPosition);
      done();
    });
  });

  test('should place a bomb', (done) => {
    const bombPosition = { x: 2, y: 2 };
    client.send(JSON.stringify({ type: 'placeBomb', position: bombPosition }));
    client.on('message', (message) => {
      const data = JSON.parse(message);
      expect(data.type).toBe('bombPlaced');
      expect(data.position).toEqual(bombPosition);
      done();
    });
  });

  test('should broadcast player lives to all players', (done) => {
    const client1 = new WebSocket('ws://localhost:8080');
    const client2 = new WebSocket('ws://localhost:8080');
  
    client1.on('open', () => {
      client1.send(JSON.stringify({ type: 'createOrJoinGame' }));
    });
  
    client2.on('open', () => {
      client2.send(JSON.stringify({ type: 'createOrJoinGame' }));
    });
  
    client2.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'updateLives') {
        expect(data.playerIndex).toBe(1);
        expect(data.lives).toBe(2);
        client1.close();
        client2.close();
        done();
      }
    });
  
    client1.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'gameCreated' || data.type === 'joinedExistingGame') {
        client1.send(JSON.stringify({
          type: 'updateLives',
          playerIndex: 0,
          lives: 2
        }));
      }
    });
  });

  test('should decrease player lives on bomb collision', (done) => {
    const client = new WebSocket('ws://localhost:8080');
  
    client.on('open', () => {
      client.send(JSON.stringify({ type: 'createOrJoinGame' }));
    });
  
    client.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'gameCreated' || data.type === 'joinedExistingGame') {
        client.send(JSON.stringify({
          type: 'placeBomb',
          position: { x: 1, y: 1 },
          radius: 1
        }));
      }
      if (data.type === 'updateLives') {
        expect(data.lives).toBe(2);
        client.close();
        done();
      }
    });
  });

  test('should remove player when lives reach 0', (done) => {
    const client = new WebSocket('ws://localhost:8080');
  
    client.on('open', () => {
      client.send(JSON.stringify({ type: 'createOrJoinGame' }));
    });
  
    let loseLifeCount = 0;
    client.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'gameCreated' || data.type === 'joinedExistingGame') {
        for (let i = 0; i < 3; i++) {
          client.send(JSON.stringify({
            type: 'updateLives',
            playerIndex: 0,
            lives: 2 - i
          }));
        }
      }
      if (data.type === 'updateLives') {
        loseLifeCount++;
        if (loseLifeCount === 3) {
          expect(data.lives).toBe(0);
        }
      }
      if (data.type === 'playerRemoved') {
        expect(data.playerIndex).toBe(1);
        client.close();
        done();
      }
    });
  });
});