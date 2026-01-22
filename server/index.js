const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameManager = require('./game');

const app = express();
app.use(cors());

// Health check endpoint for deployment platforms
app.get('/', (req, res) => {
  res.send('Impostor Server Running');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", // In production, restrict this
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create_lobby', ({ playerName, userId }) => {
    const lobbyId = gameManager.createLobby(socket.id, playerName, userId);
    socket.join(lobbyId);
    console.log(`Lobby ${lobbyId} created by ${playerName}`);
    io.to(lobbyId).emit('lobby_update', gameManager.lobbies.get(lobbyId));
  });

  socket.on('join_lobby', ({ lobbyId, playerName, userId }) => {
    // Normalize lobbyId
    const safeLobbyId = lobbyId.toUpperCase();
    const result = gameManager.joinLobby(safeLobbyId, socket.id, playerName, userId);
    
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      socket.join(safeLobbyId);
      console.log(`${playerName} joined lobby ${safeLobbyId}`);
      io.to(safeLobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('start_game', ({ lobbyId }) => {
    const result = gameManager.startGame(lobbyId, socket.id);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      console.log(`Game started in lobby ${lobbyId}`);
      io.to(lobbyId).emit('game_started', result.lobby);
    }
  });

  socket.on('start_next_round', ({ lobbyId }) => {
    const result = gameManager.nextRound(lobbyId, socket.id);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      console.log(`Next round started in lobby ${lobbyId}`);
      io.to(lobbyId).emit('game_started', result.lobby);
    }
  });

  socket.on('start_voting', ({ lobbyId }) => {
    const result = gameManager.startVoting(lobbyId, socket.id);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('submit_vote', ({ lobbyId, userId, targetUserId }) => {
    const result = gameManager.submitVote(lobbyId, userId, targetUserId);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('end_game', ({ lobbyId }) => {
    const result = gameManager.endGame(lobbyId, socket.id);
    if (result.error) {
       socket.emit('error_message', result.error);
    } else {
       io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('add_word', ({ lobbyId, word }) => {
    const result = gameManager.addWord(lobbyId, socket.id, word);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('remove_word', ({ lobbyId, word }) => {
    const result = gameManager.removeWord(lobbyId, socket.id, word);
    if (result.error) {
      socket.emit('error_message', result.error);
    } else {
      io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('update_settings', ({ lobbyId, settings }) => {
    const result = gameManager.updateSettings(lobbyId, socket.id, settings);
    if (result.error) {
       socket.emit('error_message', result.error);
    } else {
       io.to(lobbyId).emit('lobby_update', result.lobby);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const result = gameManager.removePlayer(socket.id, (finalResult) => {
        if (!finalResult.empty) {
           io.to(finalResult.lobbyId).emit('lobby_update', finalResult.lobby);
        }
    });
    
    if (result) {
      if (!result.empty) {
         io.to(result.lobbyId).emit('lobby_update', result.lobby);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
