import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY!;

async function testREST() {
  const versions = ['v1', 'v1beta'];
  const models = ['text-embedding-004', 'embedding-001'];

  for (const v of versions) {
    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:embedContent?key=${geminiKey}`;
        const response = await axios.post(url, {
          content: { parts: [{ text: "Hola mundo" }] }
        });
        console.log(`✅ Success with ${v} and ${m}`);
      } catch (error: any) {
        console.log(`❌ Fail with ${v} and ${m}: ${error.response?.status} ${error.response?.statusText}`);
      }
    }
  }
}

testREST();
