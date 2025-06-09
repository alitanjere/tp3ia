import React, { useState, useEffect } from 'react';
import Chat from './Chat.jsx';
import { sendMessage } from './api.js';
import './App.css'; // We'll create this for basic App layout styling

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Optional: Load chat history from localStorage if we implement that later
  // useEffect(() => {
  //   const storedMessages = localStorage.getItem('chatHistory');
  //   if (storedMessages) {
  //     setMessages(JSON.parse(storedMessages));
  //   }
  // }, []);

  // Optional: Save chat history to localStorage
  // useEffect(() => {
  //   localStorage.setItem('chatHistory', JSON.stringify(messages));
  // }, [messages]);

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError('');
    setInput(''); // Clear input field immediately

    try {
      const assistantResponseText = await sendMessage(input);
      const assistantMessage = {
        id: Date.now() + 1, // Ensure unique ID
        text: assistantResponseText,
        sender: 'assistant',
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (err) {
      console.error("Error in App.jsx handleSubmit:", err);
      setError(err.message || 'Failed to get response from assistant.');
      // Optionally add the error as a message in the chat
      const errorMessage = {
        id: Date.now() + 1,
        text: \`Error: \${err.message || 'Failed to get response'}\`,
        sender: 'assistant', // Or a special 'error' sender type
        isError: true, // Custom flag
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Asistente de Estudiantes</h1>
      </header>
      <main className="chat-wrapper">
        <Chat messages={messages} />
        {isLoading && <div className="loading-indicator">Pensando...</div>}
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            className="message-input"
          />
          <button type="submit" disabled={isLoading} className="send-button">
            Enviar
          </button>
        </form>
      </main>
      <footer className="app-footer">
        <p>LLM2-Web Chat Interface</p>
      </footer>
    </div>
  );
}

export default App;
