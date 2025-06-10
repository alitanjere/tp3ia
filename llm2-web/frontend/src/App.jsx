import React, { useState, useEffect } from 'react';
import Chat from './Chat.jsx';
import { sendMessage } from './api.js'; // sendMessage will be updated later
import './App.css';

const CHAT_HISTORY_KEY = 'chatHistory';
const MODEL_SETTINGS_KEY = 'chatModelSettings';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Default model and temperature
  const [model, setModel] = useState('qwen3:1.7b'); // Default model from agent.js
  const [temperature, setTemperature] = useState(0.75); // Default temperature

  // Load settings from localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(MODEL_SETTINGS_KEY);
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        if (parsedSettings.model) setModel(parsedSettings.model);
        if (parsedSettings.temperature !== undefined) setTemperature(parseFloat(parsedSettings.temperature));
      }
      const storedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages)) setMessages(parsedMessages);
      }
    } catch (e) {
      console.error("Failed to load settings or history from localStorage:", e);
    }
  }, []);

  // Save settings and messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify({ model, temperature }));
      if (messages.length > 0) {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } else {
        localStorage.removeItem(CHAT_HISTORY_KEY);
      }
    } catch (e) {
      console.error("Failed to save settings or history to localStorage:", e);
    }
  }, [model, temperature, messages]);

  const handleInputChange = (event) => setInput(event.target.value);
  const handleModelChange = (event) => setModel(event.target.value);
  const handleTemperatureChange = (event) => {
    const newTemp = parseFloat(event.target.value);
    if (!isNaN(newTemp) && newTemp >= 0 && newTemp <= 2) { // Typical temperature range
      setTemperature(newTemp);
    } else if (event.target.value === "") {
        setTemperature(0); // Or some default, or allow empty to reset
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setIsLoading(true);
    setError('');
    const currentInput = input;
    setInput('');

    try {
      // Pass model and temperature to sendMessage
      const assistantResponseText = await sendMessage(currentInput, model, temperature);
      const assistantMessage = { id: Date.now() + 1, text: assistantResponseText, sender: 'assistant' };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (err) {
      console.error("Error in App.jsx handleSubmit:", err);
      const errorMessageText = err.message || 'Failed to get response from assistant.';
      setError(errorMessageText);
      const errorMessageForChat = { id: Date.now() + 1, text: `Error: ${errorMessageText}`, sender: 'assistant', isError: true };
      setMessages((prevMessages) => [...prevMessages, errorMessageForChat]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Asistente de Estudiantes</h1>
        <div className="settings-bar">
          <label htmlFor="model-input">Modelo:</label>
          <input
            type="text"
            id="model-input"
            value={model}
            onChange={handleModelChange}
            placeholder="e.g., qwen3:1.7b"
          />
          <label htmlFor="temp-input">Temperatura:</label>
          <input
            type="number"
            id="temp-input"
            value={temperature}
            onChange={handleTemperatureChange}
            min="0"
            max="2"
            step="0.05"
          />
        </div>
      </header>
      <main className="chat-wrapper">
        <Chat messages={messages} />
        {isLoading && (
          <div className="spinner-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Pensando...</div>
          </div>
        )}
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
