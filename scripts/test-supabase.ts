import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testSupabase() {
  console.log('🔗 Conectando a Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('📊 Verificando datos en manual_knowledge...');
  const { count, error: countError } = await supabase
    .from('manual_knowledge')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error leyendo tabla:', countError.message);
  } else {
    console.log(`✅ Tabla encontrada. Registros totales: ${count}`);
  }

  console.log('🧪 Probando RPC match_manual_knowledge...');
  // Dummy embedding (768 ceros)
  const dummyEmbedding = new Array(768).fill(0);
  
  const { data, error: rpcError } = await supabase.rpc('match_manual_knowledge', {
    query_embedding: dummyEmbedding,
    match_threshold: 0,
    match_count: 1,
    p_category: null,
    p_expert: null
  });

  if (rpcError) {
    console.error('❌ Error en RPC:', rpcError.message);
    console.error('Detalles:', rpcError.hint || rpcError.details);
  } else {
    console.log('✅ RPC funcionando correctamente.');
    if (data && data.length > 0) {
      console.log('📝 Muestra de contenido:', data[0].content.substring(0, 100) + '...');
    } else {
      console.log('⚠️ No se encontraron coincidencias (esperado con dummy embedding).');
    }
  }
}

testSupabase();
