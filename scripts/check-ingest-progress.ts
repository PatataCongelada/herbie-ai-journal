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
  console.error('❌ Error: Faltan variables de entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const MANUALS_DIR = './docs/manuals';

async function checkProgress() {
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
  console.log(`🔍 Analizando ${files.length} archivos...`);

  let totalChunksRequired = 0;
  let totalChunksUploaded = 0;
  const details = [];

  for (const filePath of files) {
    const relativePath = path.relative(MANUALS_DIR, filePath);
    const fileName = path.basename(filePath);

    // Calc required chunks
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const fullText = data.text;
    const chunkSize = 1000;
    const overlap = 200;
    let required = 0;
    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      if (fullText.substring(i, i + chunkSize).trim().length >= 20) {
        required++;
      }
    }

    // Calc uploaded chunks
    const posixPath = relativePath.split(path.sep).join('/');
    const { count } = await supabase
      .from('manual_knowledge')
      .select('id', { count: 'exact', head: true })
      .filter('metadata->>full_path', 'eq', posixPath);

    const uploaded = count || 0;
    totalChunksRequired += required;
    totalChunksUploaded += uploaded;

    const percentage = required > 0 ? (uploaded / required * 100).toFixed(1) : '0';
    details.push({ fileName, uploaded, required, percentage });
  }

  console.log('\n--- DETALLE POR ARCHIVO ---');
  details.forEach(d => console.log(`${d.fileName}: ${d.uploaded}/${d.required} (${d.percentage}%)`));

  const totalPercentage = (totalChunksUploaded / totalChunksRequired * 100).toFixed(2);
  console.log('\n--- RESUMEN TOTAL ---');
  console.log(`Fragmentos totales: ${totalChunksUploaded} / ${totalChunksRequired}`);
  console.log(`PROGRESO GLOBAL: ${totalPercentage}%`);
}

checkProgress().catch(console.error);
