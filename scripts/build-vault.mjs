// Encrypts the private notes for the hidden viewer (five quick taps on the
// navbar name) into public/vault.json. The notes stay in the gitignored
// job-search/ folder and only ciphertext is written; public/vault.json is
// gitignored too and ships only through `vercel deploy --prebuilt`.
//
//   npm run vault
//
// Passphrase: VAULT_PASSPHRASE, else job-search/VAULT-PASSPHRASE.txt.
// What goes in: job-search/vault/manifest.json (tabs + fill-in fields).

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encryptVault, unlockVault } from '../src/lib/vaultCrypto.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const NOTES = join(ROOT, 'job-search')
const OUT = join(ROOT, 'public', 'vault.json')

async function passphrase() {
  if (process.env.VAULT_PASSPHRASE) return process.env.VAULT_PASSPHRASE.trim()
  const file = join(NOTES, 'VAULT-PASSPHRASE.txt')
  if (existsSync(file)) return (await readFile(file, 'utf8')).trim()
  throw new Error('Set VAULT_PASSPHRASE or create job-search/VAULT-PASSPHRASE.txt')
}

const secret = await passphrase()
if (secret.length < 20) throw new Error('Passphrase must be at least 20 characters — the ciphertext is public')

const manifest = JSON.parse(await readFile(join(NOTES, 'vault', 'manifest.json'), 'utf8'))
const files = []
for (const { title, path } of manifest.files) {
  files.push({ name: title, content: await readFile(join(NOTES, path), 'utf8') })
}

const vault = await encryptVault({ fields: manifest.fields, files }, secret)

// Round-trip before writing, so a broken vault never ships.
const { payload } = await unlockVault(vault, secret)
if (payload.files.length !== files.length) throw new Error('Round-trip check failed')

await writeFile(OUT, JSON.stringify(vault))
console.log(`vault: ${files.length} tabs, ${(JSON.stringify(vault).length / 1024).toFixed(1)} KB encrypted → public/vault.json`)
