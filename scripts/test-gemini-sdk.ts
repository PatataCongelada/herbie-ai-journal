import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

async function test() {
  console.log('Testing startChat with empty history...');
  const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  try {
    const chat = chatModel.startChat({ history: [] });
    await chat.sendMessage("hola");
    console.log('startChat OK!');
  } catch(e) {
    console.error('startChat failed:', e.message);
  }

  console.log('\nTesting startChat with systemInstruction...');
  const chatModel2 = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: "You are an assistant."
  });
  try {
    const chat2 = chatModel2.startChat({ history: [] });
    await chat2.sendMessage("hola");
    console.log('startChat with systemInstruction OK!');
  } catch(e) {
    console.error('startChat with systemInstruction failed:', e.message);
  }

}

test();
