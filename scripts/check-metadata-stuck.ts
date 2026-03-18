import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkLastMetadata() {
  const { data, error } = await supabase
    .from('manual_knowledge')
    .select('metadata')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Metadata de los últimos fragmentos:');
  console.log(JSON.stringify(data, null, 2));
}

checkLastMetadata();
