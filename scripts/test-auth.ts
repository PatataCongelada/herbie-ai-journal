import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

async function testAuth() {
  console.log("🔐 Testing Supabase Auth...");
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (error) {
      console.log("❌ Auth Error (expected if already exists or blocked):", error.message);
    } else {
      console.log("✅ Auth seems to work. User ID:", data.user?.id);
    }
  } catch (err: any) {
    console.error("❌ Critical Auth Error:", err.message);
  }
}

testAuth();
