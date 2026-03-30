import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function findV1() {
  // Try forcing V1 API version
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  
  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro"
  ];
  
  for (const m of models) {
    try {
      console.log(`Trying [${m}] on V1...`);
      // Note: The SDK usually handles versioning, but let's try a simple getModel
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent("test");
      console.log(`SUCCESS [${m}]!`);
      return;
    } catch (e: any) {
      console.log(`FAIL [${m}]: ${e.message.substring(0, 50)}...`);
    }
  }
}
findV1();
