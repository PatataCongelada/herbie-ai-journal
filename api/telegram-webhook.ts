import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Configuración de variables de entorno
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!botToken || !geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno críticas en el servidor.');
}

const bot = new Telegraf(botToken);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Modelo optimizado para rapidez y gratuito
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });

// Función para buscar conocimiento clínico en los manuales (RAG)
async function getClinicalContext(query: string): Promise<string> {
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
      match_count: 3,
    });

    if (error || !matches || matches.length === 0) return "";

    return "\n\nCONTEXTO CLÍNICO RELEVANTE DE LOS MANUALES:\n" + 
      matches.map((m: any) => `- ${m.content}`).join("\n");
  } catch (err) {
    console.error("Error en búsqueda semántica:", err);
    return "";
  }
}

const SYSTEM_PROMPT = `Eres Herbie, un asistente clínico empático y profesional. 
Tu objetivo es ayudar al usuario a realizar autorregistros clínicos de calidad.

REGLAS DE INTERACCIÓN:
1. Responde siempre con empatía y validación clínica.
2. Si el usuario te da una emoción pero falta la intensidad (0-10), pídela amablemente.
3. Si el usuario se refiere a un momento pasado (ej: "ayer", "hace un rato"), intenta capturar la fecha/hora aproximada.
4. Si el usuario indica que no quiere registrar nada, "cancela", o "para", respeta su decisión.
5. Mantén tus respuestas naturales y conversacionales.

FORMATO DE RESPUESTA (CRÍTICO):
Debes responder SIEMPRE con este esquema exacto:
[PARTE CONVERSACIONAL]
{ "json_data": { 
    "emotion": string | null, 
    "intensity": number | null, 
    "thought": string | null, 
    "conduct": string | null, 
    "event_date": string | null, 
    "plan": "activacion" | "rumia" | "meditacion", // Selecciona el más adecuado
    "is_final": boolean, 
    "should_cancel": boolean 
  } 
}

- Respuesta natural: Responde de forma BREVE y empática (máximo 2 frases). Solo confirma los datos importantes (emoción, intensidad). No des lecciones a menos que el usuario pregunte.
- Plan Categorization: 
  * 'activacion': Si habla de actividades, rutinas, falta de ganas o planes.
  * 'rumia': Si habla de dar vueltas a la cabeza, pensamientos o "rayadas".
  * 'meditacion': Si habla de relajación, respiración o estados físicos.
  * 'aba': Si menciona conductas específicas, antecedentes o consecuencias claras.
  * Si no está claro, usa 'activacion' por defecto.

- Experto Tomás Carrasco: Sé invisiblemente experto. Usa su enfoque para sintetizar la conducta en el JSON, pero en el chat mantente ágil y breve.

- is_final: true solo cuando tengas al menos emoción e intensidad Y el usuario parezca haber terminado esa entrada.
- should_cancel: true si el usuario pide cancelar o dejar de registrar.
- Contexto temporal: La fecha de hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

// Función auxiliar para procesar con Gemini y manejar sesiones
async function processAndSave(parts: any[], ctx: any) {
  const telegramId = ctx.from?.id;
  const messageTimestamp = ctx.message?.date ? new Date(ctx.message.date * 1000).toISOString() : new Date().toISOString();
  if (!telegramId) return;

  try {
    // 1. Obtener sesión actual
    let history: any[] = [];
    const { data: session } = await supabase
      .from('bot_sessions')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    if (session) {
      const lastMessageAt = new Date(session.last_message_at);
      if (lastMessageAt > tenMinutesAgo) {
        history = session.history || [];
      }
    }

    // 2. Buscar contexto clínico relevante (RAG)
    const currentQuery = typeof parts[0] === 'string' ? parts[0] : "";
    const manualContext = currentQuery ? await getClinicalContext(currentQuery) : "";

    // 3. Preparar contexto para Gemini (Prompt + Historia + Contexto Manual + Partes nuevas)
    const contextualParts = [
      SYSTEM_PROMPT + manualContext,
      ...history.map(m => `${m.role === 'user' ? 'Usuario' : 'Herbie'}: ${m.content}`),
      ...parts
    ];

    const result = await model.generateContent(contextualParts);
    const response = await result.response;
    const fullText = response.text().trim();
    
    // 3. Parsear respuesta
    const jsonMatch = fullText.match(/\{[\s\S]*\}/);
    const naturalResponse = fullText.replace(/\{[\s\S]*\}/, "").trim();
    const jsonText = jsonMatch ? jsonMatch[0] : null;
    
    if (naturalResponse) {
      await ctx.reply(naturalResponse);
    }

    let isFinal = false;
    let shouldCancel = false;
    let extractedData: any = null;

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        extractedData = parsed.json_data || parsed; // Soportar ambos formatos
        isFinal = !!extractedData.is_final;
        shouldCancel = !!extractedData.should_cancel;
      } catch (e) {
        console.error("Error parseando JSON:", e);
      }
    }

    // 4. Manejar persistencia
    if (shouldCancel) {
      // Limpiar sesión
      await supabase.from('bot_sessions').delete().eq('telegram_id', telegramId);
    } else if (isFinal && extractedData && (extractedData.emotion || extractedData.intensity)) {
      // Guardar registro final con timestamp del mensaje original
      const finalData = {
        ...extractedData,
        recorded_at: messageTimestamp
      };

      const { error: logError } = await supabase
        .from('autorregistros')
        .insert([{ data: finalData }]);
      
      if (logError) throw logError;
      
      // Limpiar sesión tras éxito
      await supabase.from('bot_sessions').delete().eq('telegram_id', telegramId);
    } else {
      // Actualizar historia de la sesión
      const newUserMsg = typeof parts[0] === 'string' ? parts[0] : "(Audio/Multimodal)";
      const updatedHistory = [...history, { role: 'user', content: newUserMsg }];
      if (naturalResponse) updatedHistory.push({ role: 'assistant', content: naturalResponse });
      
      // Mantener solo los últimos 6 mensajes para no saturar el contexto
      const finalHistory = updatedHistory.slice(-6);

      await supabase.from('bot_sessions').upsert({
        telegram_id: telegramId,
        history: finalHistory,
        last_message_at: now.toISOString()
      }, { onConflict: 'telegram_id' });
    }

  } catch (err: any) {
    console.error('Error en el bot:', err);
    let msg = `❌ Error: ${err.message || 'Error desconocido'}`;
    if (err.status === 429) {
      msg = `⚠️ **Límite alcanzado:** Espera un momento.`;
    }
    await ctx.reply(msg, { parse_mode: 'Markdown' });
  }
}

// Handler para el comando /start
bot.start((ctx) => ctx.reply('¡Hola! Soy Herbie, tu asistente clínico. Puedes enviarme una nota de voz o escribirme cómo te sientes para registrarlo en tu diario.'));

// Lógica para mensajes de texto
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  await processAndSave([ctx.message.text], ctx);
});

// Lógica para mensajes de voz
bot.on('voice', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    const fileId = ctx.message.voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    // Descargar audio como Buffer
    const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Enviar a Gemini directamente con el buffer base64
    const audioPart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'audio/ogg'
      }
    };

    await processAndSave([audioPart, "Analiza este audio y extrae los datos clínicos."], ctx);
  } catch (err: any) {
    console.error('Error en nota de voz:', err);
    await ctx.reply('❌ Error al procesar el audio.');
  }
});

// Endpoint principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('--- Incoming Webhook ---');
  console.log('Method:', req.method);
  
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'Herbie Gemini Bot is running!',
      env: {
        TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
        GOOGLE_GEMINI_API_KEY: !!process.env.GOOGLE_GEMINI_API_KEY,
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    });
  }

  try {
    if (req.method === 'POST') {
      console.log('Body:', JSON.stringify(req.body));
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    }
  } catch (err: any) {
    console.error('SERVER ERROR:', err);
    // Devolvemos 200 aunque haya error para que Telegram no siga reintentando 
    // y bloqueando el bot, pero logueamos el fallo.
    return res.status(200).send(`Error Handled: ${err.message}`);
  }
}
