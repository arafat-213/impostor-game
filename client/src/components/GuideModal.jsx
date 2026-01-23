import React from 'react';

function GuideModal({ isOpen, onClose }) {
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
        zIndex: 2000,
        backdropFilter: 'blur(5px)'
    }}>
      <div className="card fade-in" onClick={e => e.stopPropagation()} style={{
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid var(--primary-color)',
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

        <h2 style={{ color: 'var(--primary-color)', textAlign: 'center', marginBottom: '1.5rem' }}>Game Guide</h2>
        
        <div style={{ textAlign: 'left', width: '100%' }}>
          <h3 style={{ color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>How to Play</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>1. Every player is given the same secret word, except the <strong>Impostors</strong>.</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>2. Impostors don't know the word, but they see the category or are just told they are the Impostor.</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>3. Players take turns describing the word without giving it away too easily.</p>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>4. After everyone has spoken, everyone votes on who they think is the Impostor.</p>
        </div>

        <div style={{ textAlign: 'left', width: '100%' }}>
          <h3 style={{ color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>Scoring System</h3>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Innocents:</p>
            <ul style={{ paddingLeft: '20px', listStyle: 'disc', marginBottom: '1rem' }}>
              <li style={{ background: 'none', padding: 0, margin: '4px 0', display: 'list-item' }}><strong>+10 points</strong> if you correctly vote for an Impostor.</li>
            </ul>
            
            <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Impostors:</p>
            <ul style={{ paddingLeft: '20px', listStyle: 'disc', marginBottom: 0 }}>
              <li style={{ background: 'none', padding: 0, margin: '4px 0', display: 'list-item' }}><strong>+5 points</strong> for every vote that falls on an Innocent player.</li>
              <li style={{ background: 'none', padding: 0, margin: '4px 0', display: 'list-item' }}><strong>0 points</strong> if you are <strong>caught</strong> (received the most votes).</li>
            </ul>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: '2rem' }}>Got it!</button>
      </div>
    </div>
  );
}

export default GuideModal;
