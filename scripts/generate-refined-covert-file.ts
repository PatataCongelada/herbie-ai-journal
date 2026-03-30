import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

async function generateRefinedCovert() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "Eres un Arquitecto Clínico Experto (basado en Joseph Cautela). Generas especificaciones JSON rigurosas para herramientas de terapia de conducta."
  });

  const prompt = `Genera la especificación JSON completa para 'Condicionamiento Encubierto (Protocolo Cautela - 6 Pasos)'. 
  
  PASOS OBLIGATORIOS:
  1. Preparación y Relajación (RMP/Respiración).
  2. Evaluación de Nitidez de Imágenes (Test sensorial).
  3. Identificación del Blanco (Meta/Conducta y Antecedentes).
  4. Diseño de Escenarios (Aversivo para reducir o Reforzante para aumentar).
  5. Entrenamiento de Ensayos (Ciclo de 10-15 repeticiones guiadas).
  6. Plan de Generalización y Tareas.

  Devuelve SOLO el JSON sin markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    // Strip markdown if AI ignored instructions
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    
    fs.writeFileSync('public/refined-covert.json', text);
    console.log("✅ JSON guardado en public/refined-covert.json");
  } catch (err) {
    console.error(err);
  }
}
generateRefinedCovert();
