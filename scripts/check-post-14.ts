import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkAfterFourteen() {
  const { count, error } = await supabase
    .from('manual_knowledge')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', '2026-03-18T14:00:00Z');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Fragmentos creados después de las 14:00 UTC: ${count}`);
  
  if (count && count > 0) {
    const { data } = await supabase
      .from('manual_knowledge')
      .select('created_at, metadata->source')
      .gt('created_at', '2026-03-18T14:00:00Z')
      .order('created_at', { ascending: false })
      .limit(5);
    console.log('Últimos fragmentos post-14:00:');
    console.table(data);
  }
}

checkAfterFourteen();
