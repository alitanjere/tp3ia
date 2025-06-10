import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Estudiantes } from "./lib/estudiantes.js";

const GLOBAL_DEBUG = false; // For LlamaIndex verbose logging of the global agent if ever used
const FUNCTION_DEBUG = true; // For runAgent specific logging

const estudiantes = new Estudiantes();
estudiantes.cargarEstudiantesDesdeJson();

// Define default values, also used if frontend doesn't send them
const DEFAULT_MODEL = "qwen3:1.7b";
const DEFAULT_TEMPERATURE = 0.75;

const systemPrompt = \`
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.
Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes
Respondé de forma clara y breve.
\`.trim();

// Tools are defined once and reused
const buscarPorNombreTool = tool({ /* ... tool definition ... */
    name: "buscarPorNombre",
    description: "Usa esta función para encontrar estudiantes por su nombre",
    parameters: z.object({ nombre: z.string().describe("El nombre del estudiante a buscar"), }),
    execute: async ({ nombre }) => { return estudiantes.buscarEstudiantePorNombre(nombre); },
});
const buscarPorApellidoTool = tool({ /* ... tool definition ... */
    name: "buscarPorApellido",
    description: "Usa esta función para encontrar estudiantes por su apellido",
    parameters: z.object({ apellido: z.string().describe("El apellido del estudiante a buscar"), }),
    execute: async ({ apellido }) => { return estudiantes.buscarEstudiantePorApellido(apellido); },
});
const agregarEstudianteTool = tool({ /* ... tool definition ... */
    name: "agregarEstudiante",
    description: "Usa esta función para agregar un nuevo estudiante",
    parameters: z.object({ nombre: z.string().describe("El nombre del estudiante"), apellido: z.string().describe("El apellido del estudiante"), curso: z.string().describe("El curso del estudiante (ej: 4A, 4B, 5A)"), }),
    execute: async ({ nombre, apellido, curso }) => { return estudiantes.agregarEstudiante(nombre, apellido, curso); },
});
const listarEstudiantesTool = tool({ /* ... tool definition ... */
    name: "listarEstudiantes",
    description: "Usa esta función para mostrar todos los estudiantes",
    parameters: z.object({}),
    execute: async () => { return estudiantes.listarEstudiantes(); },
});

const allTools = [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool];

// Helper function to remove <think>...</think> blocks
function cleanResultMessage(resultString) {
    if (typeof resultString !== 'string') return "";
    const cleanedString = resultString.replace(/<think>[\s\S]*?<\/think>/gi, "");
    return cleanedString.trim();
}

export async function runAgent(message, modelName, temp) {
    const currentModel = modelName || DEFAULT_MODEL;
    const currentTemperature = (temp !== undefined && temp !== null) ? parseFloat(temp) : DEFAULT_TEMPERATURE;

    if (FUNCTION_DEBUG) console.log(`[runAgent] Using model: "${currentModel}", temperature: ${currentTemperature} for message: "${message}"`);

    try {
        // Create new Ollama and Agent instances for each call to use specific settings
        const localOllama = new Ollama({
            model: currentModel,
            temperature: currentTemperature,
            timeout: 2 * 60 * 1000, // Default timeout
        });

        const localAgent = agent({
            tools: allTools,
            llm: localOllama,
            verbose: GLOBAL_DEBUG, // Use a global debug for LlamaIndex if needed
            systemPrompt: systemPrompt,
        });

        const agentResponse = await localAgent.run(message);

        if (FUNCTION_DEBUG) {
            console.log("[AGENT_DEBUG] Raw response from localAgent.run():", JSON.stringify(agentResponse, null, 2));
            // Add more detailed logging if needed, similar to previous versions
        }

        if (agentResponse && agentResponse.data && typeof agentResponse.data.result === 'string') {
            const cleanedResult = cleanResultMessage(agentResponse.data.result);
            if (cleanedResult) return cleanedResult;
        }

        if (typeof agentResponse === 'string' && agentResponse.trim() !== '' && agentResponse !== "StopEvent") {
            return agentResponse;
        } else if (agentResponse && typeof agentResponse.response === 'string' && agentResponse.response.trim() !== '') {
            return agentResponse.response;
        } else if (agentResponse && typeof agentResponse.output === 'string' && agentResponse.output.trim() !== '') {
            return agentResponse.output;
        }

        if (FUNCTION_DEBUG) console.warn("[AGENT_DEBUG] Could not extract a clean user-facing message. Agent Response:", JSON.stringify(agentResponse, null, 2));

        if (agentResponse && agentResponse.displayName === 'StopEvent') {
             return "El agente ha completado su ciclo de pensamiento pero no generó un mensaje visible. Intenta ser más específico.";
        }
        return "No se pudo obtener una respuesta clara del asistente.";

    } catch (error) {
        console.error("[runAgent] Error during agent execution:", error);
        // Check if the error is due to model not found by Ollama
        if (error.message && (error.message.includes("Model not found") || (error.cause && error.cause.message && error.cause.message.includes("model not found")))) {
            return `Error: El modelo "${currentModel}" no fue encontrado por Ollama. Por favor, asegúrate de que está disponible (ej: usa 'ollama pull ${currentModel}').`;
        }
        if (error.message && error.message.includes("ECONNREFUSED")) {
             return "Error: No se pudo conectar con Ollama. Asegúrate de que Ollama esté corriendo.";
        }
        return "Hubo un error al procesar tu mensaje con el agente.";
    }
}
