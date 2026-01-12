import { readFile } from 'fs/promises';

(async () => {
  const envRaw = await (async () => {
    try { return await readFile('.env', 'utf8'); } catch { return null; }
  })();

  if (!envRaw) {
    console.log('NO_KEY');
    process.exit(0);
  }

  const m = envRaw.match(/^VITE_AI_API_KEY=(.*)$/m);
  const key = m && m[1] ? m[1].trim() : undefined;
  if (!key) {
    console.log('NO_KEY');
    process.exit(0);
  }

  if (typeof fetch !== 'function') {
    console.log('NO_NATIVE_FETCH');
    process.exit(1);
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + encodeURIComponent(key);

  const body = {
    contents: [
      {
        parts: [
          { text: 'Oi' }
        ]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('STATUS', res.status);
    const txt = await res.text();

    try {
      const data = JSON.parse(txt);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (res.status === 200 && text && text.trim() !== '') {
        console.log('TEXT', text.trim());
        process.exit(0);
      }

      if (text && text.trim() !== '') {
        console.log('TEXT', text.trim());
        process.exit(0);
      }

      console.log('NO_TEXT', JSON.stringify(data, null, 2));
      process.exit(1);
    } catch (e) {
      console.log('INVALID_JSON', txt);
      process.exit(1);
    }
  } catch (err) {
    console.log('FETCH_ERR', err && err.message ? err.message : String(err));
    process.exit(1);
  }
})();
