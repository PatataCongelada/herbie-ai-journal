import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error('❌ Error: Faltan variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GEMINI_API_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const MANUALS_DIR = './docs/manuals';

async function ingest() {
  const files = fs.readdirSync(MANUALS_DIR).filter(f => f.endsWith('.pdf'));

  console.log(`📚 Encontrados ${files.length} manuales para procesar...`);

  for (const file of files) {
    const filePath = path.join(MANUALS_DIR, file);
    console.log(`\n📄 Procesando: ${file}...`);
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const fullText = data.text;

    // 1. Chunking (fragmentación)
    // Dividimos por párrafos o bloques de ~1000 caracteres con solapamiento
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      chunks.push(fullText.substring(i, i + chunkSize).trim());
    }

    console.log(`🧩 Generados ${chunks.length} fragmentos. Subiendo a Supabase...`);

    // 2. Generar Embeddings y Subir
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 20) continue; // Ignorar fragmentos muy cortos

      try {
        const result = await embeddingModel.embedContent(chunk);
        const embedding = result.embedding.values;

        const { error } = await supabase
          .from('manual_knowledge')
          .insert({
            content: chunk,
            embedding: embedding,
            metadata: {
              source: file,
              chunk_index: i,
              total_chunks: chunks.length
            }
          });

        if (error) throw error;
        
        if (i % 10 === 0) {
          process.stdout.write('.'); // Progreso
        }
      } catch (err) {
        console.error(`\n❌ Error en fragmento ${i} de ${file}:`, err);
      }
    }
    console.log(`\n✅ ${file} completado.`);
  }

  console.log('\n✨ ¡Proceso de ingesta finalizado!');
}

ingest().catch(console.error);
