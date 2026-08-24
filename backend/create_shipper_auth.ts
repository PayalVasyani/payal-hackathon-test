import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const email = 'shipper.loadflow@test.com';
  const password = 'Shipper@123';

  // Check if exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const existing = users?.find(u => u.email === email);

  if (existing) {
    console.log(`User ${email} already exists in Supabase. Updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existing.id,
      { password: password, email_confirm: true }
    );
    if (updateError) {
      console.error('Failed to update password:', updateError.message);
    } else {
      console.log('Password updated successfully.');
    }
  } else {
    console.log(`Creating user ${email} in Supabase...`);
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    });

    if (error) {
      console.error('Failed to create user:', error.message);
    } else {
      console.log(`User created successfully with ID: ${data.user.id}`);
    }
  }
}

main().catch(console.error);
