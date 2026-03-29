import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function checkSchema() {
  console.log("📊 Checking autorregistros schema...");
  const { data, error } = await supabase
    .from('autorregistros')
    .select('*')
    .limit(1);

  if (error) {
    console.error("❌ Error fetching autorregistros:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("✅ Columns found in autorregistros:", Object.keys(data[0]));
    console.log("📝 Sample record:", JSON.stringify(data[0], null, 2));
  } else {
    console.log("ℹ️ No records found in autorregistros, cannot infer schema easily from data.");
    // Try to get column information differently if possible, or just assume standard fields
  }
}

checkSchema();
