import React from 'react';

function ManagePlayersModal({ isOpen, onClose, players, onKickPlayer, myId }) {
  if (!isOpen) return null;

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
        zIndex: 3000,
        backdropFilter: 'blur(5px)'
    }}>
      <div className="card fade-in" onClick={e => e.stopPropagation()} style={{
          maxWidth: '400px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid var(--error-color)',
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
                fontSize: '1.2rem',
                margin: 0,
                padding: '5px'
            }}
        >✕</button>

        <h2 style={{ color: 'var(--error-color)', textAlign: 'center', marginBottom: '1.5rem' }}>Lobby Management</h2>
        
        <div style={{ width: '100%', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>Host only: Kick players from the game</p>
          {players.map(p => (
            <div key={p.userId} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                marginBottom: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 'bold' }}>{p.name} {p.id === myId && '(YOU)'}</span>
                {!p.connected && <span style={{ fontSize: '0.7rem', color: 'var(--error-color)' }}>Disconnected</span>}
              </div>
              {p.id !== myId && (
                <button 
                    onClick={() => {
                        if (window.confirm(`Are you sure you want to kick ${p.name}?`)) {
                            onKickPlayer(p.userId);
                        }
                    }}
                    style={{ 
                        width: 'auto', 
                        margin: 0, 
                        padding: '6px 12px', 
                        fontSize: '0.7rem',
                        background: 'transparent',
                        color: 'var(--error-color)',
                        border: '1px solid var(--error-color)'
                    }}
                >
                    KICK
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{ marginTop: '1rem', background: '#333', color: 'white' }}>Close</button>
      </div>
    </div>
  );
}

export default ManagePlayersModal;
