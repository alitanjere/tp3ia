import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { Estudiantes } from "./lib/estudiantes.js";

const DEBUG = false; // LlamaIndex verbose logging

const estudiantes = new Estudiantes();
estudiantes.cargarEstudiantesDesdeJson();

const systemPrompt = `
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.

Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

Respondé de forma clara y breve.
`.trim();

const ollamaLLM = new Ollama({
    model: "qwen3:1.7b",
    temperature: 0.75,
    timeout: 2 * 60 * 1000,
});

// --- Tools (buscarPorNombreTool, buscarPorApellidoTool, etc. remain the same) ---
const buscarPorNombreTool = tool({
    name: "buscarPorNombre",
    description: "Usa esta función para encontrar estudiantes por su nombre",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante a buscar"),
    }),
    execute: async ({ nombre }) => {
        return estudiantes.buscarEstudiantePorNombre(nombre);
    },
});

const buscarPorApellidoTool = tool({
    name: "buscarPorApellido",
    description: "Usa esta función para encontrar estudiantes por su apellido",
    parameters: z.object({
        apellido: z.string().describe("El apellido del estudiante a buscar"),
    }),
    execute: async ({ apellido }) => {
        return estudiantes.buscarEstudiantePorApellido(apellido);
    },
});

const agregarEstudianteTool = tool({
    name: "agregarEstudiante",
    description: "Usa esta función para agregar un nuevo estudiante",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante"),
        apellido: z.string().describe("El apellido del estudiante"),
        curso: z.string().describe("El curso del estudiante (ej: 4A, 4B, 5A)"),
    }),
    execute: async ({ nombre, apellido, curso }) => {
        return estudiantes.agregarEstudiante(nombre, apellido, curso);
    },
});

const listarEstudiantesTool = tool({
    name: "listarEstudiantes",
    description: "Usa esta función para mostrar todos los estudiantes",
    parameters: z.object({}),
    execute: async () => {
        return estudiantes.listarEstudiantes();
    },
});
// --- End Tools ---

const elAgente = agent({
    tools: [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool],
    llm: ollamaLLM,
    verbose: DEBUG,
    systemPrompt: systemPrompt,
});

// Helper function to remove <think>...</think> blocks
function cleanResultMessage(resultString) {
    if (typeof resultString !== 'string') return "";
    // This regex will match <think> (case-insensitive)
    // and everything up to </think> (case-insensitive), across newlines.
    // It then replaces the matched part with an empty string.
    const cleanedString = resultString.replace(/<think>[\s\S]*?<\/think>/gi, "");
    return cleanedString.trim(); // Trim whitespace from start and end
}

export async function runAgent(message) {
    const FUNCTION_DEBUG = true;
    if (FUNCTION_DEBUG) console.log(`[runAgent] Calling agent with message: "${message}"`);
    try {
        const agentResponse = await elAgente.run(message);

        if (FUNCTION_DEBUG) {
            console.log("[AGENT_DEBUG] Raw response from elAgente.run():", JSON.stringify(agentResponse, null, 2)); // Stringify for better object logging
            console.log("[AGENT_DEBUG] Type of raw response:", typeof agentResponse);
            if (agentResponse && typeof agentResponse === 'object') {
                console.log("[AGENT_DEBUG] Keys in agentResponse object:", Object.keys(agentResponse));
                if (agentResponse.hasOwnProperty('data') && agentResponse.data && typeof agentResponse.data.result === 'string') {
                    console.log("[AGENT_DEBUG] agentResponse.data.result content:", agentResponse.data.result);
                } else if (agentResponse.hasOwnProperty('response') && typeof agentResponse.response === 'string') {
                     console.log("[AGENT_DEBUG] agentResponse.response content:", agentResponse.response);
                } else if (agentResponse.hasOwnProperty('output') && typeof agentResponse.output === 'string') {
                     console.log("[AGENT_DEBUG] agentResponse.output content:", agentResponse.output);
                }
            }
        }

        // --- MODIFIED LOGIC to extract the actual message ---
        if (agentResponse && agentResponse.data && typeof agentResponse.data.result === 'string') {
            const cleanedResult = cleanResultMessage(agentResponse.data.result);
            if (cleanedResult) return cleanedResult;
        }

        // Fallback checks if data.result wasn't the source
        if (typeof agentResponse === 'string' && agentResponse.trim() !== '' && agentResponse !== "StopEvent") {
            return agentResponse;
        } else if (agentResponse && typeof agentResponse.response === 'string' && agentResponse.response.trim() !== '') {
            return agentResponse.response;
        } else if (agentResponse && typeof agentResponse.output === 'string' && agentResponse.output.trim() !== '') {
            return agentResponse.output;
        }

        // If after all checks, we still haven't returned a message:
        if (FUNCTION_DEBUG) console.warn("[AGENT_DEBUG] Could not extract a clean user-facing message. Agent Response:", JSON.stringify(agentResponse, null, 2));

        // Default message if nothing useful is found, or handle StopEvent specifically if needed
        if (agentResponse && agentResponse.displayName === 'StopEvent') {
             return "El agente ha completado su ciclo de pensamiento pero no generó un mensaje visible. Intenta ser más específico.";
        }

        return "No se pudo obtener una respuesta clara del asistente."; // Final fallback

    } catch (error) {
        console.error("Error during agent execution:", error);
        return "Hubo un error al procesar tu mensaje.";
    }
}