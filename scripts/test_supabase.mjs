import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv(envPath) {
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    let val = trimmed.slice(idx + 1);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

(async function main(){
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found in project root');
    process.exit(2);
  }
  const env = loadEnv(envPath);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Supabase env vars missing in .env.local');
    process.exit(2);
  }

  const supabase = createClient(url, key);

  try {
    const medName = `test-med-${Date.now()}`;
    console.log('Inserting medication:', medName);
    const { data: medData, error: medErr } = await supabase.from('medications').insert({ name: medName }).select('id').single();
    if (medErr) {
      console.error('medications insert error:', medErr);
      process.exit(1);
    }
    console.log('Inserted medication id:', medData?.id);

    const record = {
      user_id: null,
      medication_id: medData.id,
      dosage: '10mg',
      usage: '朝食後',
      prescribed_at: new Date().toISOString(),
    };

    // Try to determine an authenticated user via anon key (likely not possible). We'll insert with user_id = null to test RLS.
    console.log('Inserting medication_records (user_id null) to test RLS');
    const { data: recData, error: recErr } = await supabase.from('medication_records').insert([record]).select('id').single();
    if (recErr) {
      console.error('medication_records insert error:', recErr);
      process.exit(1);
    }
    console.log('Inserted medication_record id:', recData?.id);

    console.log('Selecting back the record');
    const { data: sel, error: selErr } = await supabase.from('medication_records').select('*').eq('id', recData.id).single();
    if (selErr) {
      console.error('select error:', selErr);
      process.exit(1);
    }
    console.log('Record selected:', sel);
    console.log('SUCCESS');
  } catch (err) {
    console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
})();
