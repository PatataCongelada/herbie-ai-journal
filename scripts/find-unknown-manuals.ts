import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function findUnknowns() {
  const { data, error } = await supabase
    .from('manual_knowledge')
    .select('id, metadata, category, expert')
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Primeros 10 registros de la tabla:');
  console.log(JSON.stringify(data, null, 2));

  const { data: nullSources, count } = await supabase
    .from('manual_knowledge')
    .select('id', { count: 'exact', head: true })
    .is('metadata->source', null);

  console.log(`Registros con metadata->source IS NULL: ${count}`);
}

findUnknowns();
