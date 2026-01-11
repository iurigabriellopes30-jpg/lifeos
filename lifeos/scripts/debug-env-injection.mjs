/**
 * Simulate browser environment check
 * Tests if the key would be accessible in the browser context
 */

console.log("=== Simulating Browser Environment ===\n");

// Check .env file
import { readFile } from 'fs/promises';

const envRaw = await readFile('.env', 'utf8');
console.log("✓ .env file exists");
console.log(`✓ .env content length: ${envRaw.length} chars`);

const m = envRaw.match(/^VITE_AI_API_KEY=(.*)$/m);
const envKey = m && m[1] ? m[1].trim() : undefined;

if (envKey) {
  console.log(`✓ Key found in .env (length: ${envKey.length})`);
  console.log(`✓ Key starts with: ${envKey.slice(0, 10)}`);
} else {
  console.log("✗ Key NOT found in .env");
}

console.log("\n=== Vite Build Analysis ===\n");

// Check if the key would be injected in built files
const distJs = await readFile('dist/assets/index.b5ca48fe.js', 'utf8');

if (envKey && distJs.includes(envKey)) {
  console.log("✓ Key IS embedded in built JS (visible in production build)");
} else if (distJs.includes('gsk_')) {
  console.log("✓ Key starts with 'gsk_' found in built JS");
} else {
  console.log("✗ Key NOT found in built JS");
  console.log("  This explains why browser shows fallback - key not injected at build time");
}

console.log("\n=== Recommendation ===\n");
console.log("1. The .env file has the correct key");
console.log("2. The dev server should inject it automatically");
console.log("3. Check browser DevTools Console for 'DEBUG:' messages");
console.log("4. If key is missing, reload browser (hard refresh: Ctrl+Shift+R)");
