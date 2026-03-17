import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY!;

async function testDimension() {
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    // Probamos con gemini-embedding-2-preview y outputDimensionality
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });
    const result = await model.embedContent({
      content: { parts: [{ text: "Hola" }] },
      outputDimensionality: 768
    });
    console.log(`✅ Success! Dimension: ${result.embedding.values.length}`);
  } catch (err: any) {
    console.error('❌ Failed with outputDimensionality:', err.message || err);
  }
}

testDimension();
