import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTotal() {
  const { count, error } = await supabase
    .from('manual_knowledge')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total de fragmentos en manual_knowledge: ${count}`);

  // Group by source
  const { data: sources, error: error2 } = await supabase
    .from('manual_knowledge')
    .select('metadata->source, metadata->total_chunks');
  
  if (error2) {
    console.error(error2);
    return;
  }

  const counts: Record<string, {uploaded: number, total: number}> = {};
  sources.forEach((row: any) => {
    const src = row.source;
    const total = row.total_chunks;
    if (!counts[src]) {
      counts[src] = { uploaded: 0, total: total || 0 };
    }
    counts[src].uploaded++;
  });

  console.log('\nResumen por archivo (según BD):');
  console.table(Object.entries(counts).map(([file, info]) => ({
    file,
    uploaded: info.uploaded,
    estimated_total: info.total,
    percentage: info.total > 0 ? (info.uploaded / info.total * 100).toFixed(2) + '%' : '?'
  })));
}

checkTotal();
