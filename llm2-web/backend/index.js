import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
// agent.js will be created in the next step, it will export runAgent
import { runAgent } from './agent.js';

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // HTTP request logger

// POST endpoint for chat
app.post('/api/chat', async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'El campo "mensaje" es requerido.' });
  }

  try {
    // Corrected console.log line with proper backticks
    console.log(`[Backend] Received message: "${mensaje}"`);
    const respuesta = await runAgent(mensaje);
    // Corrected console.log line with proper backticks
    console.log(`[Backend] Sending response: "${respuesta}"`);
    res.json({ respuesta });
  } catch (error) {
    console.error('[Backend] Error processing chat request:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el mensaje.' });
  }
});

// Start server
app.listen(port, () => {
  // Corrected console.log line with proper backticks
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});