import axios from 'axios';

const API_URL = 'http://localhost:3001/api/chat';

/**
 * Sends a message to the backend API and returns the agent's response.
 * @param {string} mensaje The message to send to the agent.
 * @returns {Promise<string>} A promise that resolves with the agent's response string.
 * @throws {Error} If the API request fails or returns an error.
 */
export const sendMessage = async (mensaje) => {
  try {
    console.log(\`[API] Sending message: "\${mensaje}" to \${API_URL}\`);
    const response = await axios.post(API_URL, { mensaje });
    console.log('[API] Received response:', response.data);
    if (response.data && typeof response.data.respuesta === 'string') {
      return response.data.respuesta;
    } else {
      throw new Error('La respuesta de la API no tiene el formato esperado.');
    }
  } catch (error) {
    console.error('Error al enviar mensaje a la API:', error);
    let errorMessage = 'Error de conexión con el servidor.';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      errorMessage = error.response.data.error || \`Error del servidor (\${error.response.status})\`;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
      errorMessage = 'No se recibió respuesta del servidor. Verifique que el backend esté corriendo.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
      errorMessage = error.message;
    }
    // It's often better to throw the error and let the calling component handle UI updates
    throw new Error(errorMessage);
  }
};
