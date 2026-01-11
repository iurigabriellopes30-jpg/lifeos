import { readFile } from 'fs/promises';

(async () => {
  const envRaw = await readFile('.env', 'utf8');
  const m = envRaw.match(/^VITE_AI_API_KEY=(.*)$/m);
  const key = m && m[1] ? m[1].trim() : undefined;
  
  if (!key) {
    console.log('NO_KEY');
    process.exit(0);
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
      },
    });

    console.log('STATUS', res.status);
    const data = await res.json();
    
    if (data.data && Array.isArray(data.data)) {
      console.log('Available models:');
      data.data.forEach((m) => console.log(`  - ${m.id}`));
    } else {
      console.log('RESPONSE', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('ERROR', err);
  }
})();
