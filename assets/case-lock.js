// Decrypts a password-protected case study (see dev/encrypt-case.mjs).
// The page ships only ciphertext; the password derives the AES key, so a wrong password
// simply fails to decrypt. The derived key is kept in sessionStorage for this tab only.
window.CaseLock = (() => {
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const toB64 = u8 => btoa(String.fromCharCode(...u8));
  const storeKey = name => `case-key:${name}`;
  const payloads = {};
  const load = url => (payloads[url] ||= fetch(url, { cache: 'no-cache' }).then(r => {
    if (!r.ok) throw new Error('Could not load the case study.');
    return r.json();
  }));

  async function decryptWith(key, p) {
    const out = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(p.iv) }, key, b64(p.ct));
    return new TextDecoder().decode(out);
  }

  // Returns the decrypted HTML, or null if the password is wrong.
  async function unlock(name, url, password) {
    const p = await load(url);
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', hash: 'SHA-256', salt: b64(p.salt), iterations: p.iterations },
      base, { name: 'AES-GCM', length: 256 }, true, ['decrypt']);
    let html;
    try { html = await decryptWith(key, p); } catch { return null; }
    try { sessionStorage.setItem(storeKey(name), toB64(new Uint8Array(await crypto.subtle.exportKey('raw', key)))); } catch {}
    return html;
  }

  // Uses the key saved earlier in this tab. Returns HTML, or null if there is none or it no longer fits.
  async function resume(name, url) {
    let raw;
    try { raw = sessionStorage.getItem(storeKey(name)); } catch {}
    if (!raw) return null;
    try {
      const key = await crypto.subtle.importKey('raw', b64(raw), 'AES-GCM', false, ['decrypt']);
      return await decryptWith(key, await load(url));
    } catch {
      try { sessionStorage.removeItem(storeKey(name)); } catch {}
      return null;
    }
  }

  return { unlock, resume };
})();
