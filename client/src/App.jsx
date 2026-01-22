import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import './App.css';

// Initialize socket outside component to prevent multiple connections
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000');

function App() {
  const [gameState, setGameState] = useState('home'); // home, lobby, game
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');
  const [myId, setMyId] = useState('');
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [userId] = useState(() => {
    const saved = localStorage.getItem('impostor_userId');
    if (saved) return saved;
    const newId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('impostor_userId', newId);
    return newId;
  });

  useEffect(() => {
    const lastLobby = sessionStorage.getItem('impostor_lobbyId');
    const savedName = localStorage.getItem('impostor_name');
    if (lastLobby && savedName && gameState === 'home') {
      setIsReconnecting(true);
      socket.emit('join_lobby', { lobbyId: lastLobby, playerName: savedName, userId });
    }
  }, []);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setMyId(socket.id);
    });

    socket.on('lobby_update', (updatedLobby) => {
      console.log('Lobby updated:', updatedLobby);
      setLobby(updatedLobby);
      setIsReconnecting(false);
      // Save lobby ID for reconnection
      if (updatedLobby?.id) {
        sessionStorage.setItem('impostor_lobbyId', updatedLobby.id);
      }

      if (updatedLobby.status === 'playing' || updatedLobby.status === 'voting' || updatedLobby.status === 'results') {
        setGameState('game');
      } else if (updatedLobby.status === 'ended') {
        setGameState('ended');
      } else if (gameState === 'home') {
        setGameState('lobby');
        setError('');
      }
    });

    socket.on('game_started', (updatedLobby) => {
      console.log('Game started!', updatedLobby);
      setLobby(updatedLobby);
      setGameState('game');
    });

    socket.on('error_message', (msg) => {
      setError(msg);
      setIsReconnecting(false);
      if (msg === 'Lobby not found' || msg === 'Game already started') {
        sessionStorage.removeItem('impostor_lobbyId');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('lobby_update');
      socket.off('game_started');
      socket.off('error_message');
    };
  }, [gameState]);

  const createLobby = (playerName) => {
    localStorage.setItem('impostor_name', playerName);
    socket.emit('create_lobby', { playerName, userId });
  };

  const joinLobby = (lobbyId, playerName) => {
    localStorage.setItem('impostor_name', playerName);
    socket.emit('join_lobby', { lobbyId, playerName, userId });
  };

  const startGame = () => {
    if (lobby) {
      socket.emit('start_game', { lobbyId: lobby.id });
    }
  };

  const startNextRound = () => {
    if (lobby) {
      socket.emit('start_next_round', { lobbyId: lobby.id });
    }
  };

  const handleAddWord = (word) => {
    if (lobby) socket.emit('add_word', { lobbyId: lobby.id, word });
  };

  const handleRemoveWord = (word) => {
    if (lobby) socket.emit('remove_word', { lobbyId: lobby.id, word });
  };

  const handleUpdateSettings = (settings) => {
    if (lobby) socket.emit('update_settings', { lobbyId: lobby.id, settings });
  };

  const startVoting = () => {
    if (lobby) socket.emit('start_voting', { lobbyId: lobby.id });
  };

  const submitVote = (targetUserId) => {
    if (lobby) socket.emit('submit_vote', { lobbyId: lobby.id, userId, targetUserId });
  };

  const endGame = () => {
    if (lobby) socket.emit('end_game', { lobbyId: lobby.id });
  };

  const resetGame = () => {
    setGameState('lobby');
    // Scores are already in lobby.scores, host can start next round or we could reset scores here if needed
    // For now, just going back to lobby state is enough as the lobby is still there.
  };

  return (
    <>
      <div className="status-bar">
        Status: {socket.connected ? 'Connected' : 'Disconnected'} | ID: {myId}
      </div>
      
      {isReconnecting && (
        <div className="card fade-in" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Reconnecting...</h2>
          <p>Returning you to the shadows.</p>
        </div>
      )}

      {!isReconnecting && gameState === 'home' && (
        <Home 
            onCreateLobby={createLobby} 
            onJoinLobby={joinLobby} 
            error={error}
        />
      )}
      
      {gameState === 'lobby' && lobby && (
        <Lobby 
          lobby={lobby} 
          onStartGame={startGame} 
          myId={myId}
          onAddWord={handleAddWord}
          onRemoveWord={handleRemoveWord}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
      
      {gameState === 'game' && lobby && (
        <Game 
          lobby={lobby} 
          myId={myId} 
          userId={userId}
          onNextRound={startNextRound}
          onStartVoting={startVoting}
          onSubmitVote={submitVote}
          onEndGame={endGame}
        />
      )}

      {gameState === 'ended' && lobby && (
        <Leaderboard
          lobby={lobby}
          onReset={resetGame}
        />
      )}
    </>
  );
}

export default App;
