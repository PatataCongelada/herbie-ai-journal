import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Modelos disponibles:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error al listar modelos:", err);
  }
}

listModels();
