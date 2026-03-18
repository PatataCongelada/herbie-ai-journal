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

async function checkProgress() {
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
  console.log(`🔍 Analizando ${files.length} manuales locales...`);

  let totalChunksRequired = 0;
  let totalChunksUploaded = 0;
  const details = [];

  for (const filePath of files) {
    const relativePath = path.relative(MANUALS_DIR, filePath);
    const fileName = path.basename(filePath);

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    const fullText = data.text;

    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
      chunks.push(fullText.substring(i, i + chunkSize).trim());
    }

    const { count: existingCount } = await supabase
      .from('manual_knowledge')
      .select('id', { count: 'exact', head: true })
      .filter('metadata->>full_path', 'eq', relativePath);

    const uploaded = existingCount || 0;
    const required = chunks.length;
    
    totalChunksRequired += required;
    totalChunksUploaded += uploaded;

    const percentage = required > 0 ? (uploaded / required * 100).toFixed(2) : '0.00';
    
    details.push({
      file: fileName,
      uploaded,
      required,
      percentage: `${percentage}%`
    });
  }

  console.log('\n📊 Detalle por manual:');
  console.table(details);

  const totalPercentage = totalChunksRequired > 0 ? (totalChunksUploaded / totalChunksRequired * 100).toFixed(2) : '0.00';
  console.log(`\n📈 Progreso Total: ${totalChunksUploaded} / ${totalChunksRequired} fragmentos (${totalPercentage}%)`);
  
  // Also count how many files are "done" (at least 95% for small differences in chunking if any)
  const filesDone = details.filter(d => (d.uploaded / d.required) >= 0.99).length;
  console.log(`📄 Manuales completados: ${filesDone} / ${files.length}`);
}

checkProgress().catch(console.error);
