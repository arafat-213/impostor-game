const fs = require('fs');
const path = require('path');

class GameManager {
  constructor() {
    this.lobbies = new Map(); // lobbyId -> { players: [], status, word, impostorId, hostId }
    this.words = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'));
    this.disconnectTimeouts = new Map(); // userId -> timeoutId
  }

  createLobby(hostId, hostName, userId) {
    const lobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.lobbies.set(lobbyId, {
      id: lobbyId,
      players: [{ id: hostId, name: hostName, userId, connected: true }],
      hostId: hostId,
      status: 'waiting',
      word: null,
      impostorIds: [],
      words: [...this.words], // Copy default words to lobby
      settings: {
        impostorCount: 1
      },
      scores: { [userId]: 0 }, // userId -> points
      votes: {}, // userId -> targetUserId
      roundResults: null
    });
    return lobbyId;
  }

  joinLobby(lobbyId, playerId, playerName, userId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    
    // Check for reconnection
    const existingPlayer = lobby.players.find(p => p.userId === userId);
    if (existingPlayer) {
        const oldSocketId = existingPlayer.id;
        existingPlayer.id = playerId;
        existingPlayer.name = playerName; // Update name in case it changed (optional)
        existingPlayer.connected = true;
        
        // Update hostId if necessary
        if (lobby.hostId === oldSocketId) {
            lobby.hostId = playerId;
        }

        // Cancel disconnect timeout
        if (this.disconnectTimeouts.has(userId)) {
            clearTimeout(this.disconnectTimeouts.get(userId));
            this.disconnectTimeouts.delete(userId);
        }
        
        return { lobby };
    }

    if (lobby.status !== 'waiting') return { error: 'Game already started' };
    
    // Check if player name already exists (optional, but good for UX)
    // For now simple join
    
    lobby.players.push({ id: playerId, name: playerName, userId, connected: true });
    if (lobby.scores[userId] === undefined) {
        lobby.scores[userId] = 0;
    }
    return { lobby };
  }

  addWord(lobbyId, requesterId, newWord) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can manage words' };
    if (!newWord || !newWord.trim()) return { error: 'Invalid word' };
    
    const word = newWord.trim();
    if (lobby.words.includes(word)) return { error: 'Word already exists' };
    
    lobby.words.push(word);
    return { lobby };
  }

  removeWord(lobbyId, requesterId, wordToRemove) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can manage words' };
    
    lobby.words = lobby.words.filter(w => w !== wordToRemove);
    return { lobby };
  }

  updateSettings(lobbyId, requesterId, settings) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can change settings' };
    
    if (settings.impostorCount) {
        const count = parseInt(settings.impostorCount);
        if (count < 1) return { error: 'At least 1 impostor required' };
        lobby.settings.impostorCount = count;
    }
    
    return { lobby };
  }

  startGame(lobbyId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can start game' };
    if (lobby.players.length < 3) return { error: 'Need at least 3 players' };
    if (lobby.words.length === 0) return { error: 'Word list is empty! Add words.' };
    
    // Validate impostor count
    const impostorCount = lobby.settings.impostorCount;
    if (impostorCount >= lobby.players.length) {
        return { error: `Too many impostors! Max ${lobby.players.length - 1}` };
    }

    // Select random word from lobby's custom list
    const randomWord = lobby.words[Math.floor(Math.random() * lobby.words.length)];
    lobby.word = randomWord;

    // Select multiple unique impostors
    const playersCopy = [...lobby.players];
    lobby.impostorIds = [];
    
    for (let i = 0; i < impostorCount; i++) {
        const randomIndex = Math.floor(Math.random() * playersCopy.length);
        lobby.impostorIds.push(playersCopy[randomIndex].id);
        playersCopy.splice(randomIndex, 1);
    }
    
    // Backward compatibility for MVP if needed, but better to update client
    lobby.impostorId = lobby.impostorIds[0]; 

    lobby.status = 'playing';
    lobby.votes = {};
    lobby.roundResults = null;

    return { lobby };
  }

  startVoting(lobbyId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can start voting' };
    
    lobby.status = 'voting';
    lobby.votes = {};
    return { lobby };
  }

  submitVote(lobbyId, userId, targetUserId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.status !== 'voting') return { error: 'Voting not active' };

    lobby.votes[userId] = targetUserId;

    // Check if all connected players have voted
    const connectedPlayers = lobby.players.filter(p => p.connected);
    const everyoneVoted = connectedPlayers.every(p => lobby.votes[p.userId]);

    if (everyoneVoted) {
        return this.calculateScores(lobbyId);
    }

    return { lobby };
  }

  calculateScores(lobbyId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };

    const impostorIds = lobby.impostorIds;
    const roundScores = {}; // userId -> points gained this round
    const voteDetails = []; // info for UI

    lobby.players.forEach(player => {
        const targetId = lobby.votes[player.userId];
        const playerIsImpostor = impostorIds.includes(player.id);
        let pointsGained = 0;
        
        if (!playerIsImpostor) {
            // Innocent player: +10 if they voted for an impostor
            const targetPlayer = lobby.players.find(p => p.userId === targetId);
            if (targetPlayer && impostorIds.includes(targetPlayer.id)) {
                pointsGained = 10;
            }
        }
        
        roundScores[player.userId] = pointsGained;
        voteDetails.push({
            voterId: player.userId,
            voterName: player.name,
            targetId: targetId,
            targetName: lobby.players.find(p => p.userId === targetId)?.name || 'None'
        });
    });

    // Impostors get +5 for every vote on an innocent
    const innocentVotes = Object.values(lobby.votes).filter(targetUserId => {
        const targetPlayer = lobby.players.find(p => p.userId === targetUserId);
        return targetPlayer && !impostorIds.includes(targetPlayer.id);
    }).length;

    if (innocentVotes > 0) {
        const pointsForImpostors = innocentVotes * 5;
        impostorIds.forEach(impostorSocketId => {
            const impostor = lobby.players.find(p => p.id === impostorSocketId);
            if (impostor) {
                roundScores[impostor.userId] = (roundScores[impostor.userId] || 0) + pointsForImpostors;
            }
        });
    }

    // Apply round scores to total scores
    for (const userId in roundScores) {
        lobby.scores[userId] = (lobby.scores[userId] || 0) + roundScores[userId];
    }

    lobby.roundResults = {
        roundScores,
        voteDetails,
        impostorNames: lobby.players.filter(p => impostorIds.includes(p.id)).map(p => p.name)
    };
    lobby.status = 'results';

    return { lobby };
  }

  endGame(lobbyId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can end game' };

    lobby.status = 'ended';
    return { lobby };
  }

  nextRound(lobbyId, requesterId) {
    return this.startGame(lobbyId, requesterId);
  }
  
  removePlayer(socketId, onTimeout) {
    // Find which lobby the player is in
    for (const [lobbyId, lobby] of this.lobbies.entries()) {
      const playerIndex = lobby.players.findIndex(p => p.id === socketId);
      if (playerIndex !== -1) {
        const player = lobby.players[playerIndex];
        player.connected = false; // Mark as disconnected
        
        // Schedule final removal
        if (this.disconnectTimeouts.has(player.userId)) {
            clearTimeout(this.disconnectTimeouts.get(player.userId));
        }

        const timeoutId = setTimeout(() => {
            this.finalRemove(lobbyId, player.userId, onTimeout);
        }, 10000); // 10 seconds grace period
        
        this.disconnectTimeouts.set(player.userId, timeoutId);
        
        return { lobbyId, lobby, type: 'disconnect_pending' };
      }
    }
    return null;
  }

  finalRemove(lobbyId, userId, callback) {
      const lobby = this.lobbies.get(lobbyId);
      if (!lobby) return;

      const playerIndex = lobby.players.findIndex(p => p.userId === userId);
      if (playerIndex !== -1) {
          // Verify they are still disconnected before removing
          if (lobby.players[playerIndex].connected) return;

          lobby.players.splice(playerIndex, 1);
          this.disconnectTimeouts.delete(userId);

          let result = { lobbyId, lobby, empty: false };

          if (lobby.players.length === 0) {
              this.lobbies.delete(lobbyId);
              result.empty = true;
          } else {
               // Assign new host if needed
               // Use socketId for hostId comparison as per current structure
               // Note: player removed was at playerIndex. We need to check if current host is valid.
               const hostExists = lobby.players.find(p => p.id === lobby.hostId);
               if (!hostExists && lobby.players.length > 0) {
                   lobby.hostId = lobby.players[0].id;
               }
          }

          if (callback) callback(result);
      }
  }
}

module.exports = new GameManager();
