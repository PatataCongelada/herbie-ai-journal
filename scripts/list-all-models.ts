import 'dotenv/config';
import fetch from 'node-fetch';

async function listAll() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  // Try v1 to see ALL models including embeddings
  const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;

  try {
    const res = await fetch(url);
    const data: any = await res.json();
    if (data.models) {
      console.log("Checking ALL available models on v1:");
      data.models.forEach((m: any) => {
        console.log(`- ${m.name} (Methods: ${m.supportedGenerationMethods.join(', ')})`);
      });
    }
  } catch (e: any) {
    console.log(`Error: ${e.message}`);
  }
}
listAll();
