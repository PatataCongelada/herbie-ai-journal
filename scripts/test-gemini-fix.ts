import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hola, ¿estás operativo?");
    console.log("Respuesta:", result.response.text());
    console.log("TEST EXITOSO");
  } catch (err) {
    console.error("TEST FALLIDO:", err);
  }
}

test();
