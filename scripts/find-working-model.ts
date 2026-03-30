import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testAll() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash",
    "gemini-pro"
  ];
  
  for (const m of models) {
    try {
      console.log(`Testing [${m}]...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("ping");
      console.log(`✅ [${m}] WORKED:`, res.response.text());
      break; 
    } catch (e: any) {
      console.log(`❌ [${m}] FAILED: ${e.message.substring(0, 100)}...`);
    }
  }
}

testAll();
