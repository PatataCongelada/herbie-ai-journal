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
    const result = await embeddingModel.embedContent(query);
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

    const systemPrompt = `Eres Herbie, el compañero y consultor experto en Análisis de Conducta Aplicado (ABA) de tu interlocutor. 
Tu misión no es solo dar datos, sino acompañar al profesional en su razonamiento clínico con un tono humano, cálido y cercano.

${modeInstructions}

### Directrices de Personalidad:
1. **Empatía Real**: Si el usuario menciona un caso difícil o frustración, valida sus sentimientos antes de saltar al análisis técnico.
2. **Lenguaje Natural**: Evita frases excesivamente robóticas. Habla como un colega senior que está tomando un café contigo: profesional pero accesible.
3. **Escucha Activa**: Utiliza frases como "Entiendo perfectamente lo que planteas", "Esa es una observación muy aguda" o "¿Cómo te sentiste tú ante esa conducta?".
4. **Científico-Humanista**: Tu base es 100% científica (ABA), pero tu entrega es 100% humana. No eres una enciclopedia, eres un mentor.

### Uso del Contexto:
Usa el siguiente contexto extraído de los manuales para enriquecer la charla. Si el contexto NO contiene la información necesaria para responder a la pregunta, dilo claramente (ej: "No dispongo de esa información específica en mis manuales actuales"). No inventes datos técnicos si no están en el contexto, pero intenta razonar basándote en lo que sí sabemos de ABA.

Contexto clínico:
${context}`;

    // 3. Configurar el modelo con las instrucciones específicas
    const chatModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt 
    });

    // Limitamos el historial a los últimos 10 mensajes para evitar saturar el contexto
    const rawMessages = messages.slice(-11, -1); 
    const chatHistory: { role: string, parts: any[] }[] = [];
    
    // Filtramos para asegurar que empiece siempre por 'user' y alterne
    let expectedRole = 'user';
    for (let i = 0; i < rawMessages.length; i++) {
      const msgRole = rawMessages[i].role === 'assistant' ? 'model' : 'user';
      
      if (msgRole === expectedRole) {
        chatHistory.push({
          role: expectedRole,
          parts: [{ text: rawMessages[i].content }],
        });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    console.log('--- DEBUG CHAT ---');
    console.log('Final History Roles:', chatHistory.map(h => h.role));
    console.log('Last Message:', lastMessage);

    const chat = chatModel.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    return res.status(200).json({ text: response.text() });
  } catch (error: any) {
    console.error('Error en clinical-chat:', error);
    
    // Manejo específico de cuotas/límites
    if (error.status === 429 || (error.message?.includes('429')) || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('rate')) {
      // Intentar extraer el tiempo de espera del mensaje de error
      let retryAfterSeconds = 60; // Default: 60 segundos
      
      // Gemini suele incluir algo como "retry_delay { seconds: 60 }" o "Retry-After: 60"
      const retryMatch = error.message?.match(/retry[_\-]?delay[^\d]*(\d+)/i) ||
                         error.message?.match(/seconds[:\s]*(\d+)/i) ||
                         error.message?.match(/wait[^\d]*(\d+)/i) ||
                         error.errorDetails?.find((d: any) => d['@type']?.includes('RetryInfo'))?.retryDelay?.seconds;

      if (typeof retryMatch === 'number') {
        retryAfterSeconds = retryMatch;
      } else if (retryMatch?.[1]) {
        retryAfterSeconds = parseInt(retryMatch[1], 10);
      }

      const retryAt = new Date(Date.now() + retryAfterSeconds * 1000).toISOString();
      console.warn(`⚠️ Rate limit alcanzado. Retry en ${retryAfterSeconds}s (${retryAt})`);

      return res.status(429).json({ 
        text: `⏳ Has alcanzado el límite de consultas de la IA. Podrás volver a escribir en aproximadamente **${retryAfterSeconds} segundos**.`,
        error: 'RATE_LIMIT_REACHED',
        retryAfterSeconds,
        retryAt
      });
    }

    return res.status(500).json({ 
      text: "⚠️ He tenido un problema técnico al procesar tu mensaje. ¿Podrías reintentarlo?",
      error: error.message 
    });
  }
}
