import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.GOOGLE_GEMINI_API_KEY!;

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${geminiKey}`;
    const response = await axios.get(url);
    console.log('Available models:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log(`❌ Error listing models: ${error.response?.status} ${error.response?.statusText}`, error.response?.data);
  }
}

listModels();
