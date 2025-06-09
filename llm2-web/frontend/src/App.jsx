import React, { useState } from 'react'
import Chat from './Chat'
import { sendMessage } from './api'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = { id: Date.now(), sender: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setInput('')

    try {
      const respuesta = await sendMessage(input)
      const assistantMsg = { id: Date.now() + 1, sender: 'assistant', text: respuesta }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      const errorMsg = { id: Date.now() + 2, sender: 'assistant', text: 'Error al conectarse con el servidor.' }
      setMessages(prev => [...prev, errorMsg])
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20, color: 'white' }}>
      <h1>Asistente Web</h1>

      <Chat messages={messages} />

      <input
        type="text"
        placeholder="Escribí tu mensaje..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
        disabled={loading}
        style={{
          width: '100%',
          padding: '10px',
          marginTop: '10px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '1em',
        }}
      />

      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '10px',
          fontSize: '1.1em',
          backgroundColor: loading ? '#555' : '#646cff',
          color: 'white',
          borderRadius: '8px',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Enviando...' : 'Enviar'}
      </button>
    </div>
  )
}

export default App
