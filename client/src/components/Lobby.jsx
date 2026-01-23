import React, { useState } from 'react';
import GuideModal from './GuideModal';
import ManagePlayersModal from './ManagePlayersModal';

function Lobby({ lobby, onStartGame, myId, onAddWord, onRemoveWord, onUpdateSettings, onLeaveGame, onKickPlayer }) {
  const isHost = lobby.hostId === myId;
  const [copied, setCopied] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showManagePlayers, setShowManagePlayers] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(lobby.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    if (newWord.trim()) {
      onAddWord(newWord);
      setNewWord('');
    }
  };

  const changeImpostorCount = (delta) => {
    const currentCount = lobby.settings?.impostorCount || 1;
    const newCount = currentCount + delta;
    if (newCount >= 1 && newCount < lobby.players.length) {
        onUpdateSettings({ impostorCount: newCount });
    }
  };

  return (
    <div className="card fade-in" style={{ position: 'relative' }}>
      <button
        onClick={() => setShowGuide(true)}
        style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          width: 'auto',
          padding: '5px 12px',
          margin: 0,
          fontSize: '0.8rem',
          background: 'transparent',
          border: '1px solid var(--primary-color)',
          color: 'var(--primary-color)'
        }}
      >
        How to play?
      </button>

      <GuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <ManagePlayersModal
        isOpen={showManagePlayers}
        onClose={() => setShowManagePlayers(false)}
        players={lobby.players}
        onKickPlayer={onKickPlayer}
        myId={myId}
      />

      <h3 style={{ margin: 0 }}>Lobby Code</h3>
      <h1 
        onClick={copyCode} 
        style={{ fontSize: '3rem', cursor: 'pointer', margin: '0.5rem 0', letterSpacing: '4px' }}
      >
        {lobby.id}
      </h1>
      <p style={{ fontSize: '0.8rem', opacity: 0.5, color: copied ? 'var(--secondary-color)' : 'inherit' }}>
        {copied ? 'COPIED TO CLIPBOARD!' : 'Tap code to copy'}
      </p>

      {isHost && (
        <div style={{ width: '100%', marginBottom: '1rem', borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Impostors:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button 
                        onClick={() => changeImpostorCount(-1)}
                        style={{ width: '40px', padding: '5px', margin: 0 }}
                        disabled={!lobby.settings || lobby.settings.impostorCount <= 1}
                    >
                        -
                    </button>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {lobby.settings ? lobby.settings.impostorCount : 1}
                    </span>
                    <button 
                        onClick={() => changeImpostorCount(1)}
                        style={{ width: '40px', padding: '5px', margin: 0 }}
                        disabled={!lobby.settings || lobby.settings.impostorCount >= lobby.players.length - 1}
                    >
                        +
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {!isHost && lobby.settings && (
        <div style={{ margin: '1rem 0', opacity: 0.7, textAlign: 'center' }}>
          <p>Impostors: <strong>{lobby.settings.impostorCount}</strong></p>
        </div>
      )}

      {isHost && (
          <button 
            onClick={() => setShowWords(!showWords)}
            style={{ 
                border: '1px solid #444', 
                fontSize: '0.9rem',
                margin: '1rem 0',
                padding: '8px 16px'
            }}
          >
              {showWords ? 'Hide Word List' : `Manage Words (${lobby.words ? lobby.words.length : 0})`}
          </button>
      )}

      {showWords && isHost ? (
        <div style={{ width: '100%', flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <input 
                    type="text" 
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Add new word..."
                    style={{ margin: 0 }}
                />
                <button 
                    onClick={handleAdd}
                    style={{ width: 'auto', margin: 0, padding: '0 20px' }}
                >
                    +
                </button>
            </div>
            <ul style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
                {lobby.words && lobby.words.map((word, i) => (
                    <li key={i} style={{ padding: '8px', justifyContent: 'space-between', background: '#222' }}>
                        {word}
                        <span 
                            onClick={() => onRemoveWord(word)}
                            style={{ color: 'var(--error-color)', cursor: 'pointer', padding: '0 10px', fontWeight: 'bold' }}
                        >
                            ✕
                        </span>
                    </li>
                ))}
            </ul>
        </div>
      ) : (
        <div style={{ width: '100%', marginTop: '2rem', flex: 1 }}>
            <h3 style={{ textAlign: 'left' }}>Players ({lobby.players.length})</h3>
            <ul>
            {lobby.players.map(p => (
              <li key={p.id} style={{ opacity: p.connected ? 1 : 0.5 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{p.name} {!p.connected && '(Disconnected)'}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                    {p.id === lobby.hostId ? '👑 Host ' : ''}
                    {p.id === myId ? '(YOU)' : ''}
                  </span>
                </div>
              </li>
            ))}
            </ul>
            {isHost && (
              <button
                onClick={() => setShowManagePlayers(true)}
                style={{
                  marginTop: '1rem',
                  background: 'transparent',
                  border: '1px solid var(--error-color)',
                  color: 'var(--error-color)',
                  fontSize: '0.8rem',
                  padding: '8px',
                  width: 'auto'
                }}
              >
                Manage Players / Kick
              </button>
            )}
        </div>
      )}

      <div style={{ marginTop: 'auto', width: '100%' }}>
        {isHost ? (
          <button onClick={onStartGame} disabled={lobby.players.filter(p => p.connected).length < 3 || (lobby.words && lobby.words.length === 0)}>
            {lobby.players.filter(p => p.connected).length < 3
              ? 'Waiting for 3 connected players...' 
                : (lobby.words && lobby.words.length === 0) 
                    ? 'Add Words to Start'
                    : 'Start Game'}
          </button>
        ) : (
          <p className="pulse">Waiting for host to start...</p>
        )}

        <button
          onClick={onLeaveGame}
          style={{
            marginTop: '1rem',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid #333',
            fontSize: '0.9rem'
          }}
        >
          Leave Lobby
        </button>
      </div>
    </div>
  );
}

export default Lobby;
