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

// Lógica del Bot para mensajes de voz
bot.on('voice', async (ctx) => {
  try {
    const fileId = ctx.message.voice.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    
    // 1. Descargar audio como Buffer (necesario para OpenAI en entornos serverless)
    const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    // Simular un archivo para la API de OpenAI
    const file = await openai.audio.transcriptions.create({
      file: new File([buffer], 'voice.ogg', { type: 'audio/ogg' }),
      model: 'whisper-1',
    });

    const text = file.text;

    // 2. Procesar con GPT para extraer JSON dinámico
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un asistente clínico experto. Tu objetivo es extraer datos estructurados de un autorregistro de voz. 
          Genera un objeto JSON plano donde las claves representen los conceptos clínicos mencionados (ej: emotion, intensity, thought, conduct, etc.). 
          Sé preciso con la intensidad (0-10).
          Responde EXCLUSIVAMENTE con el JSON.`
        },
        { role: "user", content: text }
      ],
      response_format: { type: "json_object" }
    });

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}');

    // 3. Guardar en Supabase (tabla autorregistros, columna JSONB 'data')
    const { error } = await supabase
      .from('autorregistros')
      .insert([{ data: extractedData }]);

    if (error) throw error;

    await ctx.reply(`✅ Registro clínico guardado con éxito:\n\n"${text}"`);
  } catch (err) {
    console.error('Error en el Bot:', err);
    await ctx.reply('❌ Lo siento, hubo un fallo procesando tu voz. Asegúrate de que he configurado bien las claves API.');
  }
});

// Endpoint principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    return res.status(200).send('OK');
  }
  return res.status(200).send('Herbie Bot is running!');
}
