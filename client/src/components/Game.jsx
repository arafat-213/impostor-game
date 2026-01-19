import React, { useState, useEffect } from 'react';

function Game({ lobby, myId, onNextRound }) {
  const [revealed, setRevealed] = useState(false);
  
  // Support for multiple impostors
  const isImpostor = lobby.impostorIds 
    ? lobby.impostorIds.includes(myId) 
    : lobby.impostorId === myId;
    
  const isHost = lobby.hostId === myId;

  // Reset revealed state when the word or impostor changes (new round)
  useEffect(() => {
    setRevealed(false);
  }, [lobby.word, lobby.impostorId, lobby.impostorIds]);

  return (
    <div className="card fade-in" style={{ minHeight: '60vh', justifyContent: 'center' }}>
      {!revealed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
           <h2>Role Assigned</h2>
           <p>Only you can see this.</p>
           <button 
             onClick={() => setRevealed(true)} 
             style={{ 
               height: '200px', 
               borderRadius: '50%', 
               width: '200px',
               fontSize: '1.2rem',
               background: 'var(--surface-color)',
               border: '2px solid var(--primary-color)',
               color: 'var(--primary-color)',
               boxShadow: '0 0 20px rgba(187, 134, 252, 0.2)'
             }}
           >
             TAP TO REVEAL
           </button>
        </div>
      ) : (
        <div style={{ width: '100%', textAlign: 'center', animation: 'slideIn 0.3s ease-out' }}>
          {isImpostor ? (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--error-color)' }}>YOU ARE</h2>
              <h1 style={{ 
                fontSize: '3.5rem', 
                color: 'var(--error-color)',
                textShadow: '0 0 10px rgba(207, 102, 121, 0.5)',
                margin: '1rem 0'
              }}>
                THE IMPOSTOR
              </h1>
              <p>Blend in. Don't get caught.</p>
            </div>
          ) : (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--secondary-color)' }}>YOU ARE INNOCENT</h2>
              <p>The shared word is:</p>
                <h1 style={{ 
                  fontSize: '3.5rem',
                  padding: '10px',
                  borderRadius: '12px',
                  margin: '1rem 0',
                  border: '1px solid var(--secondary-color)'
                }}>
                  {lobby.word}
                </h1>
            </div>
          )}
          
          <button 
            onClick={() => setRevealed(false)} 
            style={{ backgroundColor: '#333', marginTop: '20px', color: 'white' }}
          >
            Hide Role
          </button>
        </div>
      )}
      
      {isHost && (
        <div style={{ 
          marginTop: 'auto', 
          width: '100%', 
          paddingTop: '20px',
          borderTop: '1px solid rgba(255,255,255,0.1)' 
        }}>
            <button 
              onClick={onNextRound} 
              style={{ backgroundColor: 'var(--secondary-color)', color: 'black' }}
            >
                Start Next Round
            </button>
        </div>
      )}
    </div>
  );
}

export default Game;
