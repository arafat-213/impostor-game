import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import './App.css';

// Initialize socket outside component to prevent multiple connections
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:4000');

function App() {
  const [gameState, setGameState] = useState('home'); // home, lobby, game
  const [lobby, setLobby] = useState(null);
  const [error, setError] = useState('');
  const [myId, setMyId] = useState('');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
      setMyId(socket.id);
    });

    socket.on('lobby_update', (updatedLobby) => {
      console.log('Lobby updated:', updatedLobby);
      setLobby(updatedLobby);
      if (gameState === 'home') {
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
    });

    return () => {
      socket.off('connect');
      socket.off('lobby_update');
      socket.off('game_started');
      socket.off('error_message');
    };
  }, [gameState]);

  const createLobby = (playerName) => {
    socket.emit('create_lobby', { playerName });
  };

  const joinLobby = (lobbyId, playerName) => {
    socket.emit('join_lobby', { lobbyId, playerName });
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

  return (
    <>
      <div className="status-bar">
        Status: {socket.connected ? 'Connected' : 'Disconnected'} | ID: {myId}
      </div>
      
      {gameState === 'home' && (
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
          onNextRound={startNextRound}
        />
      )}
    </>
  );
}

export default App;
