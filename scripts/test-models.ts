import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  try {
    // Note: The SDK doesn't have a direct listModels, but we can try to get them via the model service if available, 
    // or just try to 1.5 flash vs 2.0 flash with a simple prompt.
    const model15 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const model20 = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("Testing 1.5-flash...");
    try {
        const res15 = await model15.generateContent("ping");
        console.log("1.5-flash OK:", res15.response.text());
    } catch (e: any) {
        console.log("1.5-flash FAILED:", e.message);
    }
    
    console.log("Testing 2.0-flash...");
    try {
        const res20 = await model20.generateContent("ping");
        console.log("2.0-flash OK:", res20.response.text());
    } catch (e: any) {
        console.log("2.0-flash FAILED:", e.message);
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
