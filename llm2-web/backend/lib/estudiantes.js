import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.resolve(__dirname, '../data/alumnos.json');

export class Estudiantes {
    constructor() {
        this.estudiantes = [];
    }

    cargarEstudiantesDesdeJson() {
        try {
            const jsonData = fs.readFileSync(JSON_PATH, 'utf-8');
            const data = JSON.parse(jsonData);
            this.estudiantes = data.alumnos || [];
            console.log("Estudiantes cargados desde JSON:", this.estudiantes.length);
        } catch (error) {
            console.error("Error al cargar estudiantes desde JSON:", error);
            this.estudiantes = [];
        }
    }

    guardarEstudiantesEnJson() {
        try {
            const dataToSave = { alumnos: this.estudiantes };
            fs.writeFileSync(JSON_PATH, JSON.stringify(dataToSave, null, 2), 'utf-8');
            console.log("Estudiantes guardados en JSON.");
        } catch (error) {
            console.error("Error al guardar estudiantes en JSON:", error);
        }
    }

    buscarEstudiantePorNombre(nombre) {
        const resultados = this.estudiantes.filter(est => est.nombre.toLowerCase().includes(nombre.toLowerCase()));
        return resultados.length > 0 ? resultados : \`No se encontraron estudiantes con el nombre "\${nombre}".\`;
    }

    buscarEstudiantePorApellido(apellido) {
        const resultados = this.estudiantes.filter(est => est.apellido.toLowerCase().includes(apellido.toLowerCase()));
        return resultados.length > 0 ? resultados : \`No se encontraron estudiantes con el apellido "\${apellido}".\`;
    }

    agregarEstudiante(nombre, apellido, curso) {
        const nuevoEstudiante = { nombre, apellido, curso };
        this.estudiantes.push(nuevoEstudiante);
        this.guardarEstudiantesEnJson(); // Guardar cambios
        return \`Estudiante \${nombre} \${apellido} agregado correctamente al curso \${curso}.\`;
    }

    listarEstudiantes() {
        if (this.estudiantes.length === 0) {
            return "No hay estudiantes registrados.";
        }
        return this.estudiantes;
    }
}
