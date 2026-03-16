import { VercelRequest, VercelResponse } from '@vercel/node';
import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';

// Configuración de variables de entorno (Vercel las inyectará automáticamente)
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!botToken || !openaiApiKey || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('Faltan variables de entorno críticas en el servidor.');
}

const bot = new Telegraf(botToken);
const openai = new OpenAI({ apiKey: openaiApiKey });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función auxiliar para procesar texto con IA y guardar en Supabase
async function processAndSave(text: string, ctx: any) {
  try {
    // 1. Procesar con GPT para extraer JSON dinámico
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente clínico experto. Tu objetivo es extraer datos estructurados de un autorregistro (voz o texto). 
          Genera un objeto JSON plano donde las claves representen los conceptos clínicos mencionados (ej: emotion, intensity, thought, conduct, etc.). 
          Sé preciso con la intensidad (0-10).
          Responde EXCLUSIVAMENTE con el JSON.`
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}');

    // 2. Guardar en Supabase
    const { error } = await supabase
      .from('autorregistros')
      .insert([{ data: extractedData }]);

    if (error) throw error;

    await ctx.reply(`✅ Registro clínico guardado con éxito:\n\n"${text}"`);
  } catch (err) {
    console.error('Error procesando registro:', err);
    await ctx.reply('❌ Lo siento, hubo un fallo al procesar tu mensaje.');
  }
}

// Handler para el comando /start
bot.start((ctx) => ctx.reply('¡Hola! Soy Herbie, tu asistente clínico. Puedes enviarme una nota de voz o escribirme cómo te sientes para registrarlo en tu diario.'));

// Lógica para mensajes de texto
bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return; // Ignorar otros comandos
  await processAndSave(ctx.message.text, ctx);
});

// Lógica del Bot para mensajes de voz
bot.on('voice', async (ctx) => {
  try {
    await ctx.sendChatAction('typing');
    const fileId = ctx.message.voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    // Descargar audio
    const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Transcribir con Whisper
    const file = await openai.audio.transcriptions.create({
      file: new File([buffer], 'voice.ogg', { type: 'audio/ogg' }),
      model: 'whisper-1',
    });

    await processAndSave(file.text, ctx);
  } catch (err) {
    console.error('Error en nota de voz:', err);
    await ctx.reply('❌ Error al procesar el audio.');
  }
});

// Endpoint principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('--- Incoming Webhook ---');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    if (req.method === 'POST') {
      await bot.handleUpdate(req.body);
      console.log('Update handled successfully');
      return res.status(200).send('OK');
    }
    return res.status(200).send('Herbie Bot is running!');
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
    return res.status(500).json({ error: 'Internal Error', details: String(err) });
  }
}
