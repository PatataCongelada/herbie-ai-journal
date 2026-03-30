import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const email = "admin@herbie.com";
  const password = "herbie2024";

  console.log(`Creating admin user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin", name: "Admin Herbie" }
  });

  if (error) {
    console.error("Error:", error.message);
    if (error.message.includes("already registered")) {
      console.log("User already exists. Updating password...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === email);
      if (existing) {
        await supabase.auth.admin.updateUserById(existing.id, { password });
        console.log("Password updated successfully.");
      }
    }
  } else {
    console.log("Admin created:", data.user?.email, "ID:", data.user?.id);
  }
}

createAdmin();
