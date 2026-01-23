import React, { useState, useEffect, useRef } from 'react';

function Chat({ messages, onSendMessage, userId }) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="chat-container" style={{
        width: '100%',
        marginTop: '1.5rem',
        borderTop: '1px solid #333',
        paddingTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        height: '250px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', opacity: 0.7 }}>Game Log & Chat</h4>
      
      <div 
        ref={scrollRef}
        style={{ 
            flex: 1, 
            overflowY: 'auto', 
            marginBottom: '10px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ 
              fontSize: '0.85rem',
              textAlign: 'left',
              color: msg.type === 'system' ? 'var(--secondary-color)' : 'inherit',
              fontStyle: msg.type === 'system' ? 'italic' : 'normal'
          }}>
            <span style={{ fontWeight: 'bold', opacity: 0.6 }}>
                {msg.type === 'system' ? '📢 ' : `${msg.playerName}: `}
            </span>
            <span>{msg.text}</span>
          </div>
        ))}
        {messages.length === 0 && <p style={{ opacity: 0.3, fontSize: '0.8rem' }}>No messages yet...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '5px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          style={{ 
              margin: 0, 
              padding: '8px 12px', 
              fontSize: '0.9rem',
              flex: 1
          }}
        />
        <button 
          type="submit"
          style={{ 
              width: 'auto', 
              margin: 0, 
              padding: '5px 15px',
              fontSize: '0.8rem'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
