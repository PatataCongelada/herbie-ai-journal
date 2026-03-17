import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkBreakdown() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📊 Desglose de Conocimiento Clínico:');
  
  const { data, error } = await supabase
    .from('manual_knowledge')
    .select('category, expert, metadata->source');

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  const breakdown: Record<string, number> = {};
  data?.forEach((row: any) => {
    const key = `${row.category} | ${row.source || 'unknown'}`;
    breakdown[key] = (breakdown[key] || 0) + 1;
  });

  console.table(Object.entries(breakdown).map(([key, count]) => {
    const [cat, src] = key.split(' | ');
    return { Categoría: cat, Manual: src, Fragmentos: count };
  }));
}

checkBreakdown();
