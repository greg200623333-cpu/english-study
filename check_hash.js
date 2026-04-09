const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data } = await supabase.from('profiles').select('username, password_hash').limit(3);
  console.log('Sample users:');
  data?.forEach(u => {
    console.log(`- ${u.username}: hash length=${u.password_hash?.length}, starts with=${u.password_hash?.substring(0, 10)}`);
  });
})();
