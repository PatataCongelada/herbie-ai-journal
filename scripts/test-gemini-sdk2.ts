import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function test() {
  console.log('Testing embedContent...');
  const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });
  try {
    // @ts-ignore
    const result = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: "hola" }] },
      outputDimensionality: 768
    });
    console.log('embedContent OK!');
  } catch(e) {
    console.error('embedContent failed:', e.message);
  }

  console.log('\nTesting embedContent with direct string...');
  try {
    const result2 = await embeddingModel.embedContent("hola");
    console.log('embedContent string OK!');
  } catch(e) {
    console.error('embedContent string failed:', e.message);
  }
}

test();
