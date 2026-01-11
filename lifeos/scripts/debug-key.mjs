import { readFile } from 'fs/promises';

(async () => {
  const envRaw = await readFile('.env', 'utf8');
  console.log('RAW_ENV_LENGTH', envRaw.length);
  console.log('RAW_ENV', JSON.stringify(envRaw));
  
  const m = envRaw.match(/^VITE_AI_API_KEY=(.*)$/m);
  if (m && m[1]) {
    const key = m[1].trim();
    console.log('KEY_LENGTH', key.length);
    console.log('KEY_FIRST_10', key.slice(0, 10));
    console.log('KEY_LAST_10', key.slice(-10));
    console.log('KEY_STARTS_WITH_gsk', key.startsWith('gsk_'));
  } else {
    console.log('NO_MATCH');
  }
})();
