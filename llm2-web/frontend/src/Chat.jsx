import React, { useEffect, useRef } from 'react';

// Basic styling directly in the component for now.
// Consider moving to a separate CSS file (e.g., Chat.css) for larger applications.
const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100% - 120px)', // Example height, adjust as needed in App.jsx
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '10px 15px',
    borderRadius: '20px',
    marginBottom: '10px',
    wordWrap: 'break-word',
    fontSize: '0.9em',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: 'white',
    marginLeft: 'auto',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9e9eb',
    color: 'black',
    marginRight: 'auto',
  },
  senderName: {
    fontSize: '0.7em',
    color: '#666',
    marginBottom: '2px',
  }
};

const Chat = ({ messages }) => {
  const chatEndRef = useRef(null);

  // Scroll to the bottom of the chat on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div style={styles.chatContainer}>
        <p style={{textAlign: 'center', color: '#888'}}>No hay mensajes aún. ¡Comienza la conversación!</p>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            ...styles.messageBubble,
            ...(msg.sender === 'user' ? styles.userMessage : styles.assistantMessage),
          }}
        >
          {msg.sender === 'assistant' && <div style={styles.senderName}>Asistente</div>}
          {msg.sender === 'user' && <div style={styles.senderName}>Tú</div>}
          <div>{msg.text}</div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
};

export default Chat;
