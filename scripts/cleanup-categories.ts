import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function cleanup() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🧹 Iniciando limpieza de categorías...');

  // 1. Mapeo de archivos a categorías
  const mapping = [
    { source: 'Covert_Conditioning_Handbook.pdf', cat: 'teoria' },
    { source: 'vadecarrascum_v2.pdf', cat: 'teoria' },
    { source: 'chance_paul_first_course_behavior_analysis_spanish_cap_1.pdf', cat: 'practica' }
  ];

  for (const item of mapping) {
    console.log(`Updating ${item.source} -> ${item.cat}...`);
    const { error } = await supabase
      .from('manual_knowledge')
      .update({ category: item.cat })
      .filter('metadata->>source', 'eq', item.source);

    if (error) {
      console.error(`❌ Error actualizando ${item.source}:`, error.message);
    } else {
      console.log(`✅ ${item.source} actualizado.`);
    }
  }

  console.log('✨ Limpieza completada.');
}

cleanup();
