import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function generateRefinedCovert() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "Eres un Arquitecto Clínico Experto siguiendo estrictamente el protocolo de Joseph Cautela (1967) para Condicionamiento Encubierto. Tu objetivo es generar una especificación JSON para una herramienta digital."
  });

  const prompt = `Genera un JSON detallado para el protocolo 'Condicionamiento Encubierto Refinado (Cautela Protocol)'. 
  RECUERDA: Debe tener exactamente 6 pasos clínicos rigurosos.
  
  Paso 1: Preparación y Relajación Muscular Progresiva (RMP) abreviada.
  Paso 2: Test de Nitidez de Imágenes (Test de claridad sensorial).
  Paso 3: Identificación del Comportamiento Blanco y Metas.
  Paso 4: Diseño de Escenarios (Aversión/Refuerzo con énfasis en 'Contigüidad').
  Paso 5: Entrenamiento Guiado (Ensayos de 10 repeticiones).
  Paso 6: Registro de Tareas para casa y Generalización.

  Sigue este esquema JSON:
  {
    "tool_name": "Condicionamiento Encubierto (Protocolo Cautela)",
    "manual_source": "Cautela, J. R. (1967). Covert sensitization. Psychological Reports.",
    "protocol_overview": "...",
    "steps": [
      {
        "step_number": 1,
        "name": "...",
        "description": "...",
        "user_prompt": "...",
        "bot_guidance": "...",
        "fields": [...]
      }
    ],
    "clinical_basis": [...],
    "auto_registros_schema": { ... }
  }`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response.text());
  } catch (err) {
    console.error(err);
  }
}
generateRefinedCovert();
