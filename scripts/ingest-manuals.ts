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
  console.log('🚀 Iniciando proceso de ingesta de manuales...');
  
  // Función recursiva para buscar PDFs
  const getAllFiles = (dir: string): string[] => {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFiles(fullPath));
      } else if (file.endsWith('.pdf')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const files = getAllFiles(MANUALS_DIR);
  console.log(`📚 Encontrados ${files.length} manuales para procesar.`);

  for (const filePath of files) {
    const relativePath = path.relative(MANUALS_DIR, filePath);
    const fileName = path.basename(filePath);
    
    // Simplificación: la carpeta de primer nivel es la categoría directamente
    let expert = 'general';
    let category = 'general';
    const pathParts = relativePath.split(path.sep);
    const first = pathParts[0].toLowerCase();

    if (['teoria', 'practica', 'practico', 'teorico_practico'].includes(first)) {
      category = (first === 'practico') ? 'practica' : first;
      if (pathParts.length >= 3) expert = pathParts[1].toLowerCase();
    } else {
      expert = first;
      if (pathParts.length >= 3) category = pathParts[1].toLowerCase();
    }

    try {
      // Check how many chunks are already processed
      const { count: existingCount } = await supabase
        .from('manual_knowledge')
        .select('id', { count: 'exact', head: true })
        .filter('metadata->>full_path', 'eq', relativePath);

      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const fullText = data.text;

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
      console.log(`🧩 Fragmentos totales: ${chunks.length} (En DB: ${existingCount || 0}).`);

      for (let i = (existingCount || 0); i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk.length < 20) continue;

        let retryCount = 0;
        const maxRetries = 7;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            // Timeout promise: 25 seconds
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('TIMEOUT_API')), 25000)
            );

            // Embedding promise
            const embeddingPromise = embeddingModel.embedContent({
              content: { role: 'user', parts: [{ text: chunk }] },
              // @ts-ignore
              outputDimensionality: 768
            });

            // Race!
            const result: any = await Promise.race([embeddingPromise, timeoutPromise]);
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
            
            if (i % 20 === 0) process.stdout.write(`${Math.round((i/chunks.length)*100)}% `);
            else if (i % 2 === 0) process.stdout.write('.');
            
            success = true;
          } catch (err: any) {
            retryCount++;
            const isTimeout = err.message === 'TIMEOUT_API';
            const is429 = err.status === 429;
            const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
            
            process.stdout.write(`\n⚠️ Error en chunk ${i} (${isTimeout ? 'Timeout' : is429 ? '429' : err.message}). Reintento ${retryCount}/${maxRetries} en ${Math.round(delay/1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            if (retryCount >= maxRetries) {
              console.error(`\n❌ Se agotaron los reintentos para el fragmento ${i} de ${fileName}.`);
              throw new Error(`PERMANENT_CHUNK_ERROR: ${fileName} @ ${i}`);
            }
          }
        }
      }
      console.log(`\n✅ ${fileName} completado.`);
    } catch (error: any) {
      console.error(`\n❌ Error procesando ${fileName}:`, error.message);
      throw error; // Propagar para el reinicio global
    }
  }

  console.log('\n✨ ¡Proceso de ingesta finalizado con éxito!');
}

async function runWithRestart() {
  const MAX_GLOBAL_RESTARTS = 20;
  let restarts = 0;

  while (restarts < MAX_GLOBAL_RESTARTS) {
    try {
      await ingest();
      break; // Éxito total
    } catch (err) {
      restarts++;
      const waitTime = 30000; // Esperar 30 segundos antes de reiniciar el proceso completo
      console.log(`\n🔄 Reinicio global detectado (${restarts}/${MAX_GLOBAL_RESTARTS}). Reintentando en ${waitTime/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  if (restarts >= MAX_GLOBAL_RESTARTS) {
    console.error('\n🛑 Se alcanzó el límite de reinicios globales. Deteniendo script.');
  }
}

runWithRestart().catch(console.error);
