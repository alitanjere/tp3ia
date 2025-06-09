import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
// Adjusted import path for Estudiantes
import { Estudiantes } from "./lib/estudiantes.js";

const DEBUG = false;

const estudiantes = new Estudiantes();
// Ensure students are loaded when the module is initialized
estudiantes.cargarEstudiantesDesdeJson();

const systemPrompt = \`
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.

Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

Respondé de forma clara y breve.
\`.trim();

const ollamaLLM = new Ollama({
    model: "qwen3:1.7b", // As specified in original main.js
    temperature: 0.75,
    timeout: 2 * 60 * 1000, // 2 minutes timeout
});

// Tool: Buscar por nombre
const buscarPorNombreTool = tool({
    name: "buscarPorNombre",
    description: "Usa esta función para encontrar estudiantes por su nombre",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante a buscar"),
    }),
    execute: async ({ nombre }) => { // Made async to align with potential async nature of tools
        return estudiantes.buscarEstudiantePorNombre(nombre);
    },
});

// Tool: Buscar por apellido
const buscarPorApellidoTool = tool({
    name: "buscarPorApellido",
    description: "Usa esta función para encontrar estudiantes por su apellido",
    parameters: z.object({
        apellido: z.string().describe("El apellido del estudiante a buscar"),
    }),
    execute: async ({ apellido }) => { // Made async
        return estudiantes.buscarEstudiantePorApellido(apellido);
    },
});

// Tool: Agregar estudiante
const agregarEstudianteTool = tool({
    name: "agregarEstudiante",
    description: "Usa esta función para agregar un nuevo estudiante",
    parameters: z.object({
        nombre: z.string().describe("El nombre del estudiante"),
        apellido: z.string().describe("El apellido del estudiante"),
        curso: z.string().describe("El curso del estudiante (ej: 4A, 4B, 5A)"),
    }),
    execute: async ({ nombre, apellido, curso }) => { // Made async
        return estudiantes.agregarEstudiante(nombre, apellido, curso);
    },
});

// Tool: Listar todos los estudiantes
const listarEstudiantesTool = tool({
    name: "listarEstudiantes",
    description: "Usa esta función para mostrar todos los estudiantes",
    parameters: z.object({}),
    execute: async () => { // Made async
        return estudiantes.listarEstudiantes();
    },
});

const elAgente = agent({
    tools: [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool],
    llm: ollamaLLM,
    verbose: DEBUG,
    systemPrompt: systemPrompt,
});

// Exportable function to run the agent
export async function runAgent(message) {
    if (DEBUG) console.log(\`Calling agent with message: "\${message}"\`);
    try {
        const response = await elAgente.chat({ message });
        // LlamaIndex agent response is often an object with a 'response' property for the string,
        // or it might be directly the string for simple cases.
        // Adjust based on actual LlamaIndex agent response structure.
        // Common patterns: response.response, response.toString(), response.output
        if (response && typeof response.response === 'string') {
            return response.response;
        } else if (response && typeof response.toString === 'function') {
            // This might catch more complex objects if they have a sensible toString()
            const strResponse = response.toString();
            // Avoid returning "[object Object]" if toString is not overridden well
            if (strResponse !== '[object Object]') return strResponse;
        }
        // Fallback or if the response structure is different
        // This might need refinement based on observing the actual agent's output
        console.warn("Agent response format might not be directly a string or {response: string}. Full response:", response);
        return JSON.stringify(response); // As a last resort, stringify the whole response.
    } catch (error) {
        console.error("Error during agent execution:", error);
        return "Hubo un error al procesar tu mensaje.";
    }
}

// Removed:
// const mensajeBienvenida = \`...\`;
// empezarChat(elAgente, mensajeBienvenida);
