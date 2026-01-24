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
      words: [...this.words], 
      settings: {
        impostorCount: 1
      },
      scores: { [userId]: 0 }, // userId -> points
      votes: {}, // userId -> targetUserId
      roundResults: null,
      messages: [],
      turnOrder: [],
      currentPlayerIndex: -1
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
        const previouslyConnected = existingPlayer.connected;
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

        if (!previouslyConnected) {
            this.addSystemMessage(lobbyId, `${playerName} has reconnected.`);
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
    this.addSystemMessage(lobbyId, `${playerName} joined the lobby.`);
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
    
    const activePlayers = lobby.players.filter(p => p.connected);
    if (activePlayers.length < 3) return { error: 'Need at least 3 connected players' };
    if (lobby.words.length === 0) return { error: 'Word list is empty! Add words.' };
    
    // Validate impostor count against active players
    const impostorCount = lobby.settings.impostorCount;
    if (impostorCount >= activePlayers.length) {
        return { error: `Too many impostors! Need at least one innocent player among connected players.` };
    }

    // Select random word from lobby's current list
    const randomWord = lobby.words[Math.floor(Math.random() * lobby.words.length)];
    lobby.word = randomWord;

    // Reset game state
    lobby.status = 'playing';
    lobby.votes = {};
    lobby.roundResults = null;
    lobby.messages = [];

    // Select multiple unique impostors from ACTIVE players only
    const candidates = [...activePlayers];
    lobby.impostorIds = [];
    
    for (let i = 0; i < impostorCount; i++) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        lobby.impostorIds.push(candidates[randomIndex].userId);
        candidates.splice(randomIndex, 1);
    }
    
    // Set Turn Order (Shuffled)
    const activeUserIds = lobby.players
        .filter(p => p.connected)
        .map(p => p.userId);
    
    // Fisher-Yates Shuffle
    for (let i = activeUserIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [activeUserIds[i], activeUserIds[j]] = [activeUserIds[j], activeUserIds[i]];
    }
    
    lobby.turnOrder = activeUserIds;
    lobby.currentPlayerIndex = 0;

    // Backward compatibility for MVP if needed, but better to update client
    lobby.impostorId = lobby.impostorIds[0]; 

    this.addSystemMessage(lobbyId, `Game started! Role: Describe the word without giving it away.`);
    const firstPlayer = lobby.players.find(p => p.userId === lobby.turnOrder[0]);
    this.addSystemMessage(lobbyId, `It's ${firstPlayer?.name}'s turn to describe!`);

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

    // 1. Calculate vote counts
    const voteCounts = {}; // userId -> count
    lobby.players.forEach(p => {
        const targetId = lobby.votes[p.userId];
        if (targetId) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
    });

    // 2. Determine who got the most votes
    let maxVotes = 0;
    for (const userId in voteCounts) {
        if (voteCounts[userId] > maxVotes) {
            maxVotes = voteCounts[userId];
        }
    }

    // Players with max votes (if any)
    const mostVotedUserIds = maxVotes > 0 
        ? Object.keys(voteCounts).filter(userId => voteCounts[userId] === maxVotes)
        : [];

    // 3. Calculate points for everyone
    // Count votes that fell on innocent players
    const innocentVotes = Object.values(lobby.votes).filter(targetUserId => {
        return !impostorIds.includes(targetUserId);
    }).length;

    lobby.players.forEach(player => {
        const targetId = lobby.votes[player.userId];
        const playerIsImpostor = impostorIds.includes(player.userId);
        let pointsGained = 0;
        
        if (!playerIsImpostor) {
            // Innocent player: +10 if they voted for an impostor
            if (impostorIds.includes(targetId)) {
                pointsGained = 10;
            }
        } else {
            // Impostor player: +5 for every vote on an innocent, BUT only if they are NOT caught
            // They are caught if they are among the most voted
            const isCaught = mostVotedUserIds.includes(player.userId);
            if (!isCaught) {
                pointsGained = innocentVotes * 5;
            } else {
                pointsGained = 0;
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

    // Apply round scores to total scores
    for (const userId in roundScores) {
        lobby.scores[userId] = (lobby.scores[userId] || 0) + roundScores[userId];
    }

    lobby.roundResults = {
        roundScores,
        voteDetails,
        impostorNames: lobby.players.filter(p => impostorIds.includes(p.userId)).map(p => p.name)
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
        
        this.addSystemMessage(lobbyId, `${player.name} disconnected. Waiting 10s for reconnect...`);
        
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

          const userName = lobby.players[playerIndex].name;
          lobby.players.splice(playerIndex, 1);
          this.disconnectTimeouts.delete(userId);
          
          this.addSystemMessage(lobbyId, `${userName} left the game.`);

          // Remove from turn order if game is active
          if (lobby.turnOrder.includes(userId)) {
              const turnIndex = lobby.turnOrder.indexOf(userId);
              lobby.turnOrder.splice(turnIndex, 1);
              if (lobby.currentPlayerIndex >= turnIndex && lobby.currentPlayerIndex > 0) {
                  lobby.currentPlayerIndex--;
              }
          }

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

  kickPlayer(lobbyId, hostId, targetUserId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== hostId) return { error: 'Only host can kick players' };

    const playerIndex = lobby.players.findIndex(p => p.userId === targetUserId);
    if (playerIndex === -1) return { error: 'Player not found' };
    
    const kickedSocketId = lobby.players[playerIndex].id;
    if (kickedSocketId === hostId) return { error: 'Cannot kick yourself' };

    lobby.players.splice(playerIndex, 1);
    this.disconnectTimeouts.delete(targetUserId);

    // Remove from turn order
    if (lobby.turnOrder.includes(targetUserId)) {
        const turnIndex = lobby.turnOrder.indexOf(targetUserId);
        lobby.turnOrder.splice(turnIndex, 1);
        if (lobby.currentPlayerIndex >= turnIndex && lobby.currentPlayerIndex > 0) {
            lobby.currentPlayerIndex--;
        }
    }

    return { lobby, kickedSocketId };
  }

  leaveLobby(lobbyId, socketId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    const playerIndex = lobby.players.findIndex(p => p.id === socketId);
    if (playerIndex !== -1) {
        const userId = lobby.players[playerIndex].userId;
        lobby.players.splice(playerIndex, 1);
        this.disconnectTimeouts.delete(userId);

        if (lobby.players.length === 0) {
            this.lobbies.delete(lobbyId);
            return { empty: true };
        } else {
            if (lobby.hostId === socketId) {
                lobby.hostId = lobby.players[0].id;
            }
            return { lobby, empty: false };
        }
    }
    return null;
  }

  nextTurn(lobbyId, requesterId) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return { error: 'Lobby not found' };
    if (lobby.hostId !== requesterId) return { error: 'Only host can advance turns' };
    
    lobby.currentPlayerIndex++;
    if (lobby.currentPlayerIndex >= lobby.turnOrder.length) {
        this.addSystemMessage(lobbyId, "All players have described the word. Host can now start voting.");
        return { lobby, allTurnsDone: true };
    }

    const currentPlayerId = lobby.turnOrder[lobby.currentPlayerIndex];
    const currentPlayer = lobby.players.find(p => p.userId === currentPlayerId);
    this.addSystemMessage(lobbyId, `It's ${currentPlayer?.name}'s turn to describe!`);

    return { lobby, allTurnsDone: false };
  }

  addMessage(lobbyId, userId, text) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    const player = lobby.players.find(p => p.userId === userId);
    const message = {
        userId,
        playerName: player?.name || 'Unknown',
        text,
        timestamp: Date.now(),
        type: 'chat'
    };
    
    lobby.messages.push(message);
    // Keep last 50 messages
    if (lobby.messages.length > 50) lobby.messages.shift();
    
    return { lobby, message };
  }

  addSystemMessage(lobbyId, text) {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) return null;

    const message = {
        userId: 'system',
        playerName: 'System',
        text,
        timestamp: Date.now(),
        type: 'system'
    };
    
    lobby.messages.push(message);
    if (lobby.messages.length > 50) lobby.messages.shift();
    
    return { lobby, message };
  }
}

module.exports = new GameManager();
