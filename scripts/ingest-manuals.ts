import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
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
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });

const MANUALS_DIR = './docs/manuals';

async function ingest() {
  // Función recursiva para buscar PDFs
  const getAllFiles = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(file));
      } else if (file.endsWith('.pdf')) {
        results.push(file);
      }
    });
    return results;
  };

  const files = getAllFiles(MANUALS_DIR);

  console.log(`📚 Encontrados ${files.length} manuales para procesar...`);

  for (const filePath of files) {
    const relativePath = path.relative(MANUALS_DIR, filePath);
    const pathParts = relativePath.split(path.sep);
    
    // Simplificación: la carpeta de primer nivel es la categoría directamente
    let expert = 'general';
    let category = 'general';

    const first = pathParts[0].toLowerCase();
    if (['teoria', 'practica', 'practico', 'teorico_practico'].includes(first)) {
      category = (first === 'practico') ? 'practica' : first;
      // Si hay un segundo nivel, lo tomamos como experto
      if (pathParts.length >= 3) {
        expert = pathParts[1].toLowerCase();
      }
    } else {
      // Si el primer nivel no es una categoría, lo tomamos como experto
      expert = first;
      if (pathParts.length >= 3) {
        category = pathParts[1].toLowerCase();
      }
    }

    const fileName = path.basename(filePath);
    
    // Check how many chunks are already processed
    const { count: existingCount } = await supabase
      .from('manual_knowledge')
      .select('id', { count: 'exact', head: true })
      .filter('metadata->>full_path', 'eq', relativePath);

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const fullText = data.text;

    // 1. Chunking
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      chunks.push(fullText.substring(i, i + chunkSize).trim());
    }

    if (existingCount !== null && existingCount >= chunks.length) {
      console.log(`⏩ Saltando: ${fileName} (Completado: ${existingCount}/${chunks.length} fragmentos).`);
      continue;
    }

    console.log(`\n📄 Procesando: ${fileName} [Expert: ${expert}, Category: ${category}]...`);
    console.log(`🧩 Fragmentos: ${chunks.length} (En DB: ${existingCount || 0}). Subiendo restantes...`);

    // 2. Generar Embeddings y Subir
    for (let i = (existingCount || 0); i < chunks.length; i++) {
      const chunk = chunks[i];
      if (chunk.length < 20) continue;

      let retryCount = 0;
      const maxRetries = 5;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          // @ts-ignore
          const result = await embeddingModel.embedContent({
            content: { role: 'user', parts: [{ text: chunk }] },
            outputDimensionality: 768
          });
          const embedding = result.embedding.values;

          const { error } = await supabase
            .from('manual_knowledge')
            .insert({
              content: chunk,
              embedding: embedding,
              category: category,
              expert: expert,
              metadata: {
                source: fileName,
                full_path: relativePath,
                chunk_index: i,
                total_chunks: chunks.length
              }
            });

          if (error) throw error;
          
          if (i % 50 === 0) process.stdout.write('.');
          success = true;
        } catch (err: any) {
          if (err.status === 429) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
            console.log(`\n⚠️ Cuota excedida (429). Reintentando en ${Math.round(delay/1000)}s... (Intento ${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            console.error(`\n❌ Error en fragmento ${i}:`, err);
            break; // No reintentar en otros errores
          }
        }
      }
    }
    console.log(`\n✅ ${fileName} completado.`);
  }

  console.log('\n✨ ¡Proceso de ingesta finalizado!');
}

ingest().catch(console.error);
