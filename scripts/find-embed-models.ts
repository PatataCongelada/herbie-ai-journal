import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

async function findEmbedModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GEMINI_API_KEY}`);
    const data = await response.json();
    const embedModels = data.models.filter((m: any) => 
      m.supportedGenerationMethods.includes('embedContent')
    );
    console.log("Modelos de Embedding:", JSON.stringify(embedModels, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

findEmbedModels();
