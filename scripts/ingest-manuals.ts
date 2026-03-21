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
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  systemInstruction: "" // Se actualizará en cada request
});
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

      const BATCH_SIZE = 100;
      for (let i = (existingCount || 0); i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        const validBatch = batchChunks.filter(c => c.length >= 20);
        if (validBatch.length === 0) continue;

        let retryCount = 0;
        const maxRetries = 7;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            console.log(`📡 Enviando lote de ${validBatch.length} fragmentos (Progreso: ${i}/${chunks.length})...`);
            
            // 1. Obtener embeddings en lote
            const result = await embeddingModel.batchEmbedContents({
              requests: validBatch.map(text => ({
                content: { role: 'user', parts: [{ text }] },
                // @ts-ignore
                outputDimensionality: 768
              }))
            });

            const embeddings = result.embeddings.map(e => e.values);

            // 2. Insertar en Supabase en lote
            const rows = validBatch.map((chunk, index) => ({
              content: chunk,
              embedding: embeddings[index],
              category: category,
              expert: expert,
              metadata: {
                source: fileName,
                full_path: relativePath.split(path.sep).join('/'),
                chunk_index: i + index,
                total_chunks: chunks.length
              }
            }));

            const { error } = await supabase
              .from('manual_knowledge')
              .insert(rows);

            if (error) throw error;
            
            console.log(`✅ Lote completado.`);
            
            success = true;
            // En lote de 100, 1 petición por minuto es MUY seguro para el límite de 15 peticiones/min
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (err: any) {
            retryCount++;
            const errorMessage = err.message?.toLowerCase() || "";
            const is429 = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate');
            
            if (retryCount >= maxRetries) {
              if (is429) {
                console.error(`\n❌ Cuota diaria de la API agotada.`);
                throw new Error(`QUOTA_EXCEEDED: Límite alcanzado en ${fileName} @ ${i}`);
              }
              throw new Error(`PERMANENT_BATCH_ERROR: ${fileName} @ ${i}`);
            }

            const delay = is429 
              ? Math.pow(2, retryCount + 3) * 1000 + Math.random() * 2000
              : Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
            
            console.log(`⚠️ Reintentando lote en ${Math.round(delay/1000)}s... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      console.log(`\n🎉 ${fileName} procesado totalmente.`);
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
    } catch (err: any) {
      if (err.message && err.message.includes('QUOTA_EXCEEDED')) {
        console.log('\n🛑 Límite de cuota diaria detectado. Deteniendo ejecución. El Cron Job de GitHub Actions la retomará mañana automáticamente.');
        process.exit(0);
      }
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
