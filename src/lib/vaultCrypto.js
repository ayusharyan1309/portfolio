// Passphrase encryption for the private notes viewer (SecretVault).
// scripts/build-vault.mjs encrypts with this module and the browser decrypts
// with it, so both sides always agree on the parameters. Only ciphertext is
// ever published: AES-256-GCM, key from PBKDF2-SHA256 with a random salt.

const ITERATIONS = 600_000
const encoder = new TextEncoder()
const decoder = new TextDecoder()

const toBase64 = (bytes) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
const fromBase64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

async function deriveKey(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', encoder.encode(passphrase.normalize('NFKC')), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    true, // extractable, so "remember on this device" can store the key instead of the passphrase
    ['encrypt', 'decrypt'],
  )
}

async function decryptWith(key, vault) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(vault.iv) }, key, fromBase64(vault.ct))
  return JSON.parse(decoder.decode(plain))
}

export async function encryptVault(payload, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, ITERATIONS)
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(payload))))
  return { v: 3, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS, salt: toBase64(salt), iv: toBase64(iv), ct: toBase64(ct) }
}

export function isVault(data) {
  return !!data && data.v === 3 && typeof data.ct === 'string' && typeof data.salt === 'string'
}

/** Throws if the passphrase is wrong. Returns the payload and an exportable key. */
export async function unlockVault(vault, passphrase) {
  const key = await deriveKey(passphrase, fromBase64(vault.salt), vault.iterations)
  const payload = await decryptWith(key, vault)
  const rawKey = toBase64(new Uint8Array(await crypto.subtle.exportKey('raw', key)))
  return { payload, rawKey }
}

/** Opens the vault with a key saved by unlockVault. Throws if it no longer fits (re-encrypted vault). */
export async function openVaultWithKey(vault, rawKey) {
  const key = await crypto.subtle.importKey('raw', fromBase64(rawKey), 'AES-GCM', false, ['decrypt'])
  return decryptWith(key, vault)
}
