import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function finalTest25() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const m = "gemini-2.5-flash"; // From the earlier list
  try {
    console.log(`Testing [${m}]...`);
    const model = genAI.getGenerativeModel({ model: m });
    const res = await model.generateContent("test");
    console.log(`SUCCESS [${m}]! Response: ${res.response.text().substring(0, 50)}`);
  } catch (e: any) {
    console.log(`FAIL [${m}]: ${e.message}`);
  }
}
finalTest25();
