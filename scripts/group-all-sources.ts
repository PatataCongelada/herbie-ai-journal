import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function groupAllSources() {
  const { data, error } = await supabase
    .from('manual_knowledge')
    .select('metadata->source');

  if (error) {
    console.error(error);
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    const src = row.source || 'UNKNOWN';
    counts[src] = (counts[src] || 0) + 1;
  });

  console.log('Todos los archivos en la BD y su número de fragmentos:');
  console.table(Object.entries(counts).map(([file, count]) => ({ file, count })));
  
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Total calculado: ${total}`);
}

groupAllSources();
