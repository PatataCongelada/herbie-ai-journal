import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

async function ping() {
  if (!geminiApiKey) {
    console.error('❌ Error: Falta GOOGLE_GEMINI_API_KEY en .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const modelsToTest = ["gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"];
  
  for (const modelName of modelsToTest) {
    console.log(`📡 Probando modelo: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Di 'PONG' si puedes oírme.");
      const response = await result.response;
      console.log(`✅ Conexión con ${modelName}: OK`);
      console.log(`🤖 Respuesta:`, response.text());
      return; 
    } catch (error: any) {
      console.error(`❌ Falló ${modelName}:`, error.message);
    }
  }
}

ping();
