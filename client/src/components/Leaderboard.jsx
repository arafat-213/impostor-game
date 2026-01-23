import React from 'react';

function Leaderboard({ lobby, onReset, onLeaveGame }) {
  // Sort players by score
  const sortedPlayers = [...lobby.players].sort((a, b) => {
    const scoreA = lobby.scores[a.userId] || 0;
    const scoreB = lobby.scores[b.userId] || 0;
    return scoreB - scoreA;
  });

  const winner = sortedPlayers[0];

  return (
    <div className="card fade-in" style={{ textAlign: 'center' }}>
      <h1 style={{ color: 'var(--secondary-color)', fontSize: '3rem', marginBottom: '0.5rem' }}>GAME OVER</h1>
      
      <div style={{ margin: '2rem 0' }}>
        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>The Winner is</p>
        <h1 style={{ 
            fontSize: '4rem', 
            color: 'var(--primary-color)',
            textShadow: '0 0 15px rgba(187, 134, 252, 0.5)'
        }}>
            {winner.name}
        </h1>
        <p style={{ fontSize: '1.5rem' }}>{lobby.scores[winner.userId] || 0} Points</p>
      </div>

      <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '2rem' }}>
        <h3>Final Standings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1rem' }}>
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.userId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '15px',
                background: index === 0 ? 'rgba(187, 134, 252, 0.1)' : '#222',
                borderRadius: '8px',
                border: index === 0 ? '1px solid var(--primary-color)' : '1px solid transparent'
              }}
            >
              <span>{index + 1}. {player.name}</span>
              <span style={{ fontWeight: 'bold' }}>{lobby.scores[player.userId] || 0} pts</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={onReset}
        style={{ marginTop: '2.5rem', border: '1px solid #444' }}
      >
        Back to Lobby
      </button>

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
        Leave Game
      </button>
    </div>
  );
}

export default Leaderboard;
