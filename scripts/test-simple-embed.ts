import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY!;

async function testEmbed() {
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });
    const result = await model.embedContent("Hola");
    console.log(`✅ Success! Dimension: ${result.embedding.values.length}`);
    console.log('Values:', result.embedding.values.slice(0, 5), '...');
  } catch (err: any) {
    console.error('❌ Embedding failed:', err);
  }
}

testEmbed();
