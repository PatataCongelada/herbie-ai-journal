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
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite",
  systemInstruction: "" // Se actualizará en cada request
});
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });

async function getClinicalContext(query: string, category: string, expert: string): Promise<string> {
  try {
    // @ts-ignore
    const result = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: query }] },
      outputDimensionality: 768
    });
    const embedding = result.embedding.values;

    const { data: matches, error } = await supabase.rpc('match_manual_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5, // Más contexto para el chat web
      p_category: category === 'all' ? null : category,
      p_expert: expert === 'all' ? null : expert
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

  const { messages, category = 'general', expert = 'general' } = req.body;
  const lastMessage = messages[messages.length - 1].content;

  try {
    // 1. Obtener contexto clínico filtrado
    const context = await getClinicalContext(lastMessage, category, expert);

    // 2. Ajustar el tono según el modo
    let modeInstructions = "";
    if (category === 'teoria') {
      modeInstructions = "Tu enfoque es TEÓRICO. Actúa como un tutor académico, explica conceptos, cita principios de ABA y sé muy riguroso técnicamente.";
    } else if (category === 'practica') {
      modeInstructions = "Tu enfoque es PRÁCTICO. Actúa como un supervisor clínico, analizando conductas, sugiriendo intervenciones y centrándote en la aplicación real.";
    } else if (category === 'teorico_practico') {
      modeInstructions = "Tu enfoque es MIXTO (Teórico-Práctico). Combina la base teórica con ejemplos de aplicación clínica.";
    }

    const systemPrompt = `Eres Herbie, un experto en Análisis de Conducta Aplicado (ABA) y psicología clínica. 
${modeInstructions}

Usa el siguiente contexto extraído de manuales clínicos para responder. 
Si el contexto no contiene la respuesta, admítelo pero intenta razonar basándote en principios generales de ABA.
Mantén un tono profesional, empático y estrictamente clínico.

Contexto clínico:
${context}`;

    // 3. Configurar el modelo con las instrucciones específicas
    const chatModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt 
    });

    const chat = chatModel.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    return res.status(200).json({ text: response.text() });
  } catch (error: any) {
    console.error('Error en clinical-chat:', error);
    return res.status(500).json({ error: error.message });
  }
}
