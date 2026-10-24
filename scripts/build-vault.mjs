// Encrypts the private notes for the hidden viewer (five quick taps on the
// navbar name) into public/vault.json. The notes stay in the gitignored
// job-search/ folder and only ciphertext is written; public/vault.json is
// gitignored too and ships only through `vercel deploy --prebuilt`.
//
//   npm run vault           # encrypt (creates job-search/VAULT-KEY.txt on first run)
//   npm run vault:secrets   # give the Worker the key + PIN; also clears a PIN lockout
//
// What goes in: job-search/vault/manifest.json (tabs + fill-in fields).

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { encryptVault, generateKey, openVaultWithKey } from '../src/lib/vaultCrypto.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const NOTES = join(ROOT, 'job-search')
const KEY_FILE = join(NOTES, 'VAULT-KEY.txt')
const OUT = join(ROOT, 'public', 'vault.json')

if (!existsSync(KEY_FILE)) {
  await writeFile(KEY_FILE, generateKey() + '\n', { mode: 0o600, flag: 'wx' })
  console.log('vault: created a new data key in job-search/VAULT-KEY.txt — run `npm run vault:secrets` before deploying')
}
const rawKey = (await readFile(KEY_FILE, 'utf8')).trim()

const manifest = JSON.parse(await readFile(join(NOTES, 'vault', 'manifest.json'), 'utf8'))
const files = []
for (const { title, path } of manifest.files) {
  files.push({ name: title, content: await readFile(join(NOTES, path), 'utf8') })
}

const vault = await encryptVault({ fields: manifest.fields, files }, rawKey)

// Round-trip before writing, so a broken vault never ships.
const payload = await openVaultWithKey(vault, rawKey)
if (payload.files.length !== files.length) throw new Error('Round-trip check failed')

await writeFile(OUT, JSON.stringify(vault))
console.log(`vault: ${files.length} tabs, ${(JSON.stringify(vault).length / 1024).toFixed(1)} KB encrypted → public/vault.json`)
