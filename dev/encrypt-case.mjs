// Encrypt a password-protected case study so its text never ships in plain HTML.
//
//   CASE_PASSWORD='…' node dev/encrypt-case.mjs            # encrypts private/filters/main.html
//
// Reads the plaintext body from private/<case>/main.html (git- and Vercel-ignored) and writes
// work/<case>/locked.json, which assets/case-lock.js decrypts in the browser with the password.
// Re-run after every edit to the private source.
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';
import { createInterface } from 'node:readline/promises';

const name = process.argv[2] || 'filters';
const ITERATIONS = 600000;

let password = process.env.CASE_PASSWORD;
if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Case study password: ');
  rl.close();
}
if (!password) throw new Error('No password given.');

const plain = await readFile(`private/${name}/main.html`, 'utf8');
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));

const b64 = u8 => Buffer.from(u8).toString('base64');
await writeFile(`work/${name}/locked.json`, JSON.stringify({
  v: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)),
}) + '\n');
console.log(`Wrote work/${name}/locked.json (${plain.length} chars encrypted).`);
