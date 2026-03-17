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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function getClinicalContext(query: string): Promise<string> {
  try {
    const result = await embeddingModel.embedContent(query);
    const embedding = result.embedding.values;

    const { data: matches, error } = await supabase.rpc('match_manual_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5, // Más contexto para el chat web
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const context = await getClinicalContext(message);

    const systemPrompt = `Eres Herbie, un experto clínico avanzado especializado en Análisis de Conducta (ABA) y Terapias de Tercera Generación. 
Tu objetivo es ayudar al terapeuta o al usuario a analizar casos basándote en los manuales de Tomás Carrasco y Joseph Cautela.

REGLAS:
1. Utiliza el CONTEXTO proporcionado de los manuales para responder con precisión técnica.
2. Si la información no está en el contexto, usa tu conocimiento general pero indica que es una sugerencia general.
3. Adopta el enfoque de Tomás Carrasco: profesional, analítico y centrado en la función de la conducta.
4. Cita fragmentos si son relevantes.
5. NO emitas diagnósticos médicos, solo análisis funcionales y sugerencias técnicas.

${context}`;

    const chat = model.startChat({
      history: history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Error en clinical-chat:', error);
    return res.status(500).json({ error: error.message });
  }
}
