import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { runAgent } from './agent.js'; // runAgent will be updated

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.post('/api/chat', async (req, res) => {
  // Destructure all expected parts from the body
  const { mensaje, model, temperature } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'El campo "mensaje" es requerido.' });
  }

  // Validate model and temperature if necessary, or rely on agent.js defaults/validation
  // For now, pass them as is. Agent.js will use defaults if they are undefined.

  try {
    console.log(`[Backend] Received message: "${mensaje}", model: ${model}, temperature: ${temperature}`);
    // Pass model and temperature to runAgent
    const respuesta = await runAgent(mensaje, model, temperature);
    console.log(`[Backend] Sending response: "${respuesta}"`);
    res.json({ respuesta });
  } catch (error) {
    console.error('[Backend] Error processing chat request:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el mensaje.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});
