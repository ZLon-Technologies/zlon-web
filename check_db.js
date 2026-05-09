import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_ZLON_SUPABASE_URL, process.env.NEXT_PUBLIC_ZLON_SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  if (error) console.error(error);
  else if (data.length > 0) console.log(Object.keys(data[0]));
  else console.log('Empty table, no error');
}
check();