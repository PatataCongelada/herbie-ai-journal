import fs from 'fs';
import path from 'path';
// @ts-ignore
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const MANUALS_DIR = './docs/manuals';

async function checkStatus() {
  const getAllFiles = (dir: string): string[] => {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];
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
  console.log(`📊 Informe de Ingestión de Manuales\n${'='.repeat(50)}`);

  for (const filePath of files) {
    const relativePath = path.relative(MANUALS_DIR, filePath);
    const fileName = path.basename(filePath);

    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      const fullText = data.text;

      // Misma lógica de chunking que ingest-manuals.ts
      const chunkSize = 1000;
      const overlap = 200;
      let expectedChunks = 0;
      for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
        expectedChunks++;
      }

      const { count: existingCount } = await supabase
        .from('manual_knowledge')
        .select('id', { count: 'exact', head: true })
        .filter('metadata->>full_path', 'eq', relativePath);

      const progress = ((existingCount || 0) / expectedChunks) * 100;
      const status = progress >= 100 ? '✅ Completado' : progress > 0 ? '⏳ En proceso' : '❌ Pendiente';

      console.log(`\n📄 Archivo: ${fileName}`);
      console.log(`   Ruta: ${relativePath}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Fragmentos: ${existingCount || 0} / ${expectedChunks} (${progress.toFixed(1)}%)`);
      
      if (progress < 100) {
        console.log(`   Quedan: ${expectedChunks - (existingCount || 0)} fragmentos.`);
      }
    } catch (err) {
      console.error(`❌ Error analizando ${fileName}:`, err);
    }
  }

  console.log(`\n${'='.repeat(50)}\n✨ Informe finalizado.`);
}

checkStatus().catch(console.error);
