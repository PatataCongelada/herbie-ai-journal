import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function search(query: string) {
  try {
    const res = await embedModel.embedContent(query);
    const embedding = res.embedding.values;

    const { data: matches, error } = await supabase.rpc('match_manual_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.4,
      match_count: 10
    });

    if (error) {
      console.error('Error fetching matches:', error);
      return;
    }

    console.log(`--- MATCHES FOR: ${query} ---`);
    matches?.forEach((m: any, i: number) => {
      console.log(`[${i+1}] (Score: ${m.similarity.toFixed(4)}) Source: ${m.metadata?.source || 'unknown'}`);
      console.log(m.content);
      console.log('---');
    });
  } catch (err) {
    console.error('Search failed:', err);
  }
}

const query = process.argv.slice(2).join(' ') || "Condicionamiento encubierto Joseph Cautela";
search(query);
