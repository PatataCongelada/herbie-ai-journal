import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Error: Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminUser() {
  const email = "admin@herbie.local";
  const password = "Herbie2025!";

  console.log(`Creando usuario admin: ${email}`);

  // Create user with admin API (pre-confirmed, no email needed)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin', name: 'Admin Herbie' }
  });

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("✅ Usuario creado y confirmado!");
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID: ${data.user.id}`);
}

createAdminUser();
