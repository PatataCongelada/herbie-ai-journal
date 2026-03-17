import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error('Falta GOOGLE_GEMINI_API_KEY.');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const prompt = `Analiza el siguiente fragmento de un diario clínico y extrae los campos indicados en formato JSON.
Frase: "${text}"

Campos a extraer:
- emotion (string): La emoción principal (ej: Tristeza).
- intensity (number 1-10): La intensidad mencionada o inferida.
- conduct (string): La conducta realizada (ej: Me fui a casa).
- situation (string): Lo que ocurrió/donde estaba.
- thoughts (string): Lo que pensaba el usuario.

Responde ÚNICAMENTE con el objeto JSON puro, sin markdown ni explicaciones.
Formato: { "emotion": "", "intensity": 5, "conduct": "", "situation": "", "thoughts": "" }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().trim();
    
    // Intentar limpiar posibles tags de markdown si Gemini los incluye por error
    const cleanedJson = jsonText.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedJson);

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error en extract-fields:', error);
    return res.status(500).json({ error: 'Error analizando el texto' });
  }
}
