import React, { useState } from 'react';

function Home({ onCreateLobby, onJoinLobby, error }) {
  const [name, setName] = useState('');
  const [lobbyId, setLobbyId] = useState('');

  return (
    <div className="card fade-in">
      <h1>Impostor</h1>
      {error && (
        <div style={{ color: 'var(--error-color)', background: 'rgba(207, 102, 121, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '1rem', width: '100%' }}>
            {error}
        </div>
      )}
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Enter the shadows or blend in with the crowd.
      </p>
      
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <h3>Start New Game</h3>
        <input 
          type="text" 
          placeholder="Your Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <button onClick={() => name && onCreateLobby(name)} disabled={!name}>
          Create Lobby
        </button>
      </div>

      <div style={{ width: '100%', borderTop: '1px solid #333', paddingTop: '1rem' }}>
        <h3>Join Existing</h3>
        <input 
          type="text" 
          placeholder="Room Code" 
          value={lobbyId} 
          onChange={(e) => setLobbyId(e.target.value)} 
          style={{ textTransform: 'uppercase' }}
        />
        <button 
          className="secondary"
          onClick={() => name && lobbyId && onJoinLobby(lobbyId, name)}
          disabled={!name || !lobbyId}
          style={{ backgroundColor: 'var(--secondary-color)' }}
        >
          Join Lobby
        </button>
      </div>
    </div>
  );
}

export default Home;
