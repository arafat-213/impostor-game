import React from 'react';

function ScoreboardModal({ isOpen, onClose, lobby }) {
  if (!isOpen) return null;

  // Sort players by total score
  const sortedPlayers = [...lobby.players].sort((a, b) => {
    const scoreA = lobby.scores[a.userId] || 0;
    const scoreB = lobby.scores[b.userId] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        backdropFilter: 'blur(5px)'
    }}>
      <div className="card fade-in" onClick={e => e.stopPropagation()} style={{
          maxWidth: '450px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid var(--secondary-color)',
          position: 'relative',
          padding: '2.5rem 1.5rem 1.5rem'
      }}>
        <button 
            onClick={onClose}
            style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                width: 'auto', 
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '1.5rem',
                padding: '5px 10px',
                cursor: 'pointer',
                marginTop: 0
            }}
        >✕</button>

        <h2 style={{ color: 'var(--secondary-color)', textAlign: 'center', marginBottom: '1.5rem' }}>Current Scores</h2>
        
        <div style={{ width: '100%' }}>
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.userId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 15px',
                background: index === 0 ? 'rgba(3, 218, 198, 0.1)' : '#222',
                borderRadius: '8px',
                marginBottom: '8px',
                border: index === 0 ? '1px solid var(--secondary-color)' : '1px solid rgba(255,255,255,0.05)',
                opacity: player.connected ? 1 : 0.5
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: index === 0 ? 'var(--secondary-color)' : '#444', 
                    color: 'black', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                }}>
                    {index + 1}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                    {player.name} 
                    {!player.connected && ' (Offline)'}
                </span>
              </div>
              <span style={{ color: 'var(--secondary-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {lobby.scores[player.userId] || 0}
              </span>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ marginTop: '1.5rem', background: '#333', color: 'white' }}>Close</button>
      </div>
    </div>
  );
}

export default ScoreboardModal;
