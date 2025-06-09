import React, { useState, useEffect } from 'react';
import Chat from './Chat.jsx'; // Assuming Chat.jsx is in the same directory
import { sendMessage } from './api.js'; // Assuming api.js is in the same directory
import './App.css';

const CHAT_HISTORY_KEY = 'chatHistory';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load chat history from localStorage when the component mounts
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // Basic validation: check if it's an array
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        } else {
          console.warn("Stored chat history is not an array, ignoring.");
          localStorage.removeItem(CHAT_HISTORY_KEY); // Clear invalid data
        }
      }
    } catch (e) {
      console.error("Failed to parse chat history from localStorage:", e);
      localStorage.removeItem(CHAT_HISTORY_KEY); // Clear corrupted data
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      // Don't save if messages is empty, unless you want to explicitly clear it
      if (messages.length > 0) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } else {
        // If messages become empty (e.g., after a clear chat feature not yet implemented),
        // remove the item from localStorage.
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    } catch (e) {
      console.error("Failed to save chat history to localStorage:", e);
    }
  }, [messages]); // This effect runs whenever the 'messages' state changes

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(), // Simple unique ID
      text: input,
      sender: 'user',
    };
    // Add user message to state first for immediate UI update
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setIsLoading(true);
    setError('');
    const currentInput = input; // Store input before clearing
    setInput(''); // Clear input field

    try {
      const assistantResponseText = await sendMessage(currentInput); // Use stored input
      const assistantMessage = {
        id: Date.now() + 1, // Ensure unique ID if responses are very fast
        text: assistantResponseText,
        sender: 'assistant',
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (err) {
      console.error("Error in App.jsx handleSubmit:", err);
      const errorMessageText = err.message || 'Failed to get response from assistant.';
      setError(errorMessageText); // Set error state to display to user

      // Optionally, add the error message to the chat display as well
      const errorMessageForChat = {
        id: Date.now() + 1,
        text: \`Error: \${errorMessageText}\`,
        sender: 'assistant', // Or a special 'error' sender type
        isError: true,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessageForChat]);
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
