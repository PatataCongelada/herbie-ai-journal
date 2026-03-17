import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { count, error } = await supabase
    .from('manual_knowledge')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error checking count:', error);
  } else {
    console.log(`✅ Registros en manual_knowledge: ${count}`);
  }
}

check();
