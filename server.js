const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let blocks = {};
let projectiles = [];

function makePlayer(id, username) {
  const colors = ['red', 'blue', 'green', 'purple', 'orange'];
  return {
    id,
    username,
    color: colors[Math.floor(Math.random() * colors.length)],
    x: 100,
    y: 100,
  };
}

io.on('connection', socket => {
  socket.on('new-player', username => {
    const player = makePlayer(socket.id, username);
    players[socket.id] = player;
    socket.emit('currentState', { players, blocks });
    socket.broadcast.emit('playerJoined', player);
  });

  socket.on('move', data => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('placeBlock', block => {
    blocks[block.key] = block.type;
    io.emit('blockUpdate', block);
  });

  socket.on('removeBlock', key => {
    delete blocks[key];
    io.emit('blockRemove', key);
  });

  socket.on('shoot', proj => {
    proj.id = Date.now() + Math.random();
    projectiles.push(proj);
    io.emit('newProjectile', proj);
  });

  socket.on('respawn', () => {
    if (players[socket.id]) {
      players[socket.id].x = 100;
      players[socket.id].y = 100;
      io.emit('playerRespawn', players[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerDisconnect', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
