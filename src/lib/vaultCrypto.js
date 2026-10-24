// Encryption for the private notes viewer (SecretVault).
// scripts/build-vault.mjs encrypts with this module and the browser decrypts
// with it, so both sides always agree on the parameters. Only ciphertext is
// published (AES-256-GCM). The data key is random and never ships with the
// site: the chatbot Worker hands it out for the right PIN (see
// chatbot/backend/src/vault.ts), so a short PIN can't be brute-forced offline.

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toBase64 = (bytes) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

const importKey = (rawKey, usage) => crypto.subtle.importKey('raw', fromBase64(rawKey), 'AES-GCM', false, [usage])

/** A new random 256-bit data key, base64-encoded. */
export function generateKey() {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)))
}

export async function encryptVault(payload, rawKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await importKey(rawKey, 'encrypt')
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(payload))))
  return { v: 4, alg: 'AES-256-GCM', iv: toBase64(iv), ct: toBase64(ct) }
}

export function isVault(data) {
  return !!data && data.v === 4 && typeof data.iv === 'string' && typeof data.ct === 'string'
}

/** Throws if the key doesn't fit this vault (wrong key, or the vault was re-keyed). */
export async function openVaultWithKey(vault, rawKey) {
  const key = await importKey(rawKey, 'decrypt')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(vault.iv) }, key, fromBase64(vault.ct))
  return JSON.parse(decoder.decode(plain))
}
