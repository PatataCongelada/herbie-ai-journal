import 'dotenv/config';
import fetch from 'node-fetch';

async function checkModels() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    console.error("No API key found in .env.local");
    return;
  }
  
  // Try v1 and v1beta to see what responds
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models?key=${key}`,
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  ];

  for (const url of endpoints) {
    try {
      console.log(`Checking ${url.substring(0, 50)}...`);
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.models) {
        console.log(`✅ Success on ${url.substring(0, 50)}`);
        const names = data.models.map((m: any) => m.name.replace('models/', ''));
        console.log("Available models:", names.join(", "));
        return;
      } else {
        console.log(`❌ Error [${res.status}]:`, data.error?.message || "Unknown error");
      }
    } catch (e: any) {
      console.log(`❌ Fetch failed for ${url.substring(0, 50)}: ${e.message}`);
    }
  }
}
checkModels();
