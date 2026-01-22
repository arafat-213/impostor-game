import React, { useState, useEffect } from 'react';

function Game({ lobby, myId, userId, onNextRound, onStartVoting, onSubmitVote, onEndGame }) {
  const [revealed, setRevealed] = useState(false);
  const hasVoted = lobby.votes && lobby.votes[userId];
  
  // Support for multiple impostors
  const isImpostor = lobby.impostorIds 
    ? lobby.impostorIds.includes(myId) 
    : lobby.impostorId === myId;
    
  const isHost = lobby.hostId === myId;

  // Reset revealed state when the word or impostor changes (new round)
  useEffect(() => {
    setRevealed(false);
  }, [lobby.word, lobby.impostorId, lobby.impostorIds]);

  if (lobby.status === 'voting') {
    return (
      <div className="card fade-in">
        <h2 style={{ color: 'var(--primary-color)' }}>VOTING TIME</h2>
        <p>Discuss and decide: Who is the Impostor?</p>

        <div style={{ width: '100%', margin: '1.5rem 0' }}>
          {lobby.players.map(player => (
            <div
              key={player.userId}
              className={`vote-item ${hasVoted ? 'disabled' : ''}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '10px',
                background: player.userId === userId ? 'rgba(255,255,255,0.05)' : '#222',
                borderRadius: '8px',
                border: lobby.votes && lobby.votes[userId] === player.userId ? '1px solid var(--primary-color)' : '1px solid transparent'
              }}
            >
              <span>{player.name} {player.userId === userId && '(YOU)'}</span>
              {player.userId !== userId && !hasVoted && (
                <button
                  onClick={() => onSubmitVote(player.userId)}
                  className="small"
                  style={{ width: 'auto', margin: 0, padding: '5px 15px' }}
                >
                  Vote
                </button>
              )}
              {lobby.votes && lobby.votes[player.userId] && (
                <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>✓ Voted</span>
              )}
            </div>
          ))}
        </div>

        {hasVoted && (
          <p className="pulse" style={{ color: 'var(--secondary-color)' }}>
            Waiting for others to vote...
          </p>
        )}
      </div>
    );
  }

  if (lobby.status === 'results') {
    return (
      <div className="card fade-in">
        <h2 style={{ color: 'var(--primary-color)' }}>ROUND RESULTS</h2>

        <div style={{ width: '100%', margin: '1rem 0', textAlign: 'left' }}>
          <h3 style={{ color: 'var(--error-color)' }}>
            Impostor{lobby.roundResults.impostorNames.length > 1 ? 's' : ''}:
            <span style={{ color: 'white' }}> {lobby.roundResults.impostorNames.join(', ')}</span>
          </h3>

          <div style={{ marginTop: '1.5rem' }}>
            <h4>Votes Cast:</h4>
            {lobby.roundResults.voteDetails.map((vote, i) => (
              <p key={i} style={{ fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>{vote.voterName}</strong> voted for <strong>{vote.targetName}</strong>
              </p>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #333', paddingTop: '10px' }}>
            <h4>Points Gained:</h4>
            {lobby.players.map(p => (
              <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.name}</span>
                <span style={{ color: (lobby.roundResults.roundScores[p.userId] || 0) > 0 ? 'var(--secondary-color)' : 'grey' }}>
                  +{lobby.roundResults.roundScores[p.userId] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: 'auto' }}>
            <button
              onClick={onNextRound}
              style={{ backgroundColor: 'var(--secondary-color)', color: 'black' }}
            >
              Next Round
            </button>
            <button
              onClick={onEndGame}
              style={{ backgroundColor: 'var(--error-color)' }}
            >
              End Game
            </button>
          </div>
        )}
      </div>
    );
  }

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
            onClick={onStartVoting}
            style={{ backgroundColor: 'var(--primary-color)', color: 'black' }}
            >
            Start Voting
            </button>
        </div>
      )}
    </div>
  );
}

export default Game;
