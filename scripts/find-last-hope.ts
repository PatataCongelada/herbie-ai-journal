import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function findOne() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-latest",
    "gemini-1.0-pro",
    "gemini-pro"
  ];
  
  for (const m of models) {
    try {
      console.log(`Trying [${m}]...`);
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("test");
      console.log(`SUCCESS [${m}]!`);
      return;
    } catch (e: any) {
      console.log(`FAIL [${m}]: ${e.message}`);
    }
  }
}
findOne();
