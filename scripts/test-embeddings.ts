import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testEmbeddings() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const models = ["text-embedding-004", "embedding-001", "models/text-embedding-004", "models/embedding-001"];
  
  for (const m of models) {
    try {
      console.log(`Testing [${m}]...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.embedContent("test");
      console.log(`✅ [${m}] SUCCESS!`);
      return;
    } catch (e: any) {
      console.log(`❌ [${m}] FAILED: ${e.message.substring(0, 50)}...`);
    }
  }
}
testEmbeddings();
