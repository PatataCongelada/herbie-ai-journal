import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
  throw new Error('Faltan variables de entorno críticas.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });

async function getClinicalContext(query: string): Promise<string> {
  try {
    const result = await embeddingModel.embedContent(query);
    const embedding = result.embedding.values;

    const { data: matches, error } = await supabase.rpc('match_manual_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5
    });

    if (error || !matches || matches.length === 0) return "";

    return "\n\nINFORMACIÓN TÉCNICA DE LOS MANUALES:\n" + 
      matches.map((m: any) => `- ${m.content}`).join("\n");
  } catch (err) {
    console.error("Error en búsqueda semántica:", err);
    return "";
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { concept } = req.body;

  if (!concept) {
    return res.status(400).json({ error: 'Concepto faltante' });
  }

  try {
    // 1. Obtener contexto clínico para ser precisos
    const context = await getClinicalContext(concept);

    // 2. Configurar el modelo para generar el programa de aprendizaje
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const systemPrompt = `Eres un experto en Análisis de Conducta (ABA) y las teorías de B.F. Skinner sobre la Enseñanza Programada.
Tu tarea es descomponer el concepto proporcionado por el usuario en una secuencia de 'Marcos de Aprendizaje' (Learning Frames) siguiendo los principios del Aprendizaje Sin Errores.

Reglas:
1. Divide la información en 8-12 pasos atómicos (mínimos).
2. Cada paso debe tener una pregunta y respuesta extremadamente sencilla para asegurar el éxito (99% de probabilidad de acierto).
3. Proporciona un 'prompt' (ayuda) que el alumno vería inicialmente (el 'prompt' debe contener la respuesta o una pista muy obvia).
4. El tono debe ser profesional y motivador.
5. Usa este contexto técnico si está disponible:
${context}

Devuelve el resultado siguiendo estrictamente este esquema JSON:
{
  "concept": "Nombre del concepto",
  "steps": [
    {
      "content": "Explicación breve y clara del paso atomizado",
      "question": "Pregunta de validación simple",
      "answer": "Respuesta exacta (una o dos palabras)",
      "prompt": "Ayuda visual o textual para asegurar el acierto"
    }
  ]
}`;

    const prompt = `Descompón el siguiente concepto clínico: ${concept}`;

    const result = await model.generateContent([systemPrompt, prompt]);
    const responseText = result.response.text();
    const learningProgram = JSON.parse(responseText);

    return res.status(200).json(learningProgram);
  } catch (error: any) {
    console.error('Error en decompose-concept:', error);
    return res.status(500).json({ 
      error: "Error al generar el programa de aprendizaje",
      details: error.message 
    });
  }
}
