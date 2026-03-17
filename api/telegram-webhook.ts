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
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const SYSTEM_PROMPT = `Eres un asistente clínico experto. Tu objetivo es extraer datos estructurados de un autorregistro (voz o texto). 
Genera un objeto JSON plano donde las claves representen los conceptos clínicos mencionados (ej: emotion, intensity, thought, conduct, etc.). 
Sé preciso con la intensidad (0-10).
Responde EXCLUSIVAMENTE con el JSON.`;

// Función auxiliar para procesar con Gemini y guardar en Supabase
async function processAndSave(parts: any[], ctx: any, originalText?: string) {
  try {
    const result = await model.generateContent([SYSTEM_PROMPT, ...parts]);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, '').trim();
    
    const extractedData = JSON.parse(jsonText);

    // Guardar en Supabase
    const { error } = await supabase
      .from('autorregistros')
      .insert([{ data: extractedData }]);

    if (error) throw error;

    const displayContent = originalText || "Nota de voz procesada";
    await ctx.reply(`✅ Registro clínico guardado con éxito:\n\n"${displayContent}"`);
  } catch (err: any) {
    console.error('Error procesando registro:', err);
    let msg = `❌ Error: ${err.message || 'Error desconocido'}`;
    if (err.status === 429) {
      msg = `⚠️ **Límite alcanzado:** Has llegado al límite de la versión gratuita de Gemini. Espera un momento antes de volver a intentarlo.`;
    }
    await ctx.reply(msg, { parse_mode: 'Markdown' });
  }
}

// Handler para el comando /start
bot.start((ctx) => ctx.reply('¡Hola! Soy Herbie (v2 Gemini), tu asistente clínico gratuito. Puedes enviarme una nota de voz o escribirme cómo te sientes.'));

// Handler de prueba
bot.command('ping', (ctx) => ctx.reply('pong 🏓 (Herbie is alive with Gemini)'));

// Lógica para mensajes de texto
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;
  await processAndSave([ctx.message.text], ctx, ctx.message.text);
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
