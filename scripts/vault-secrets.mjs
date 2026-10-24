// Gives the chatbot Worker what it needs to unlock the notes viewer:
//   VAULT_KEY       the data key            (job-search/VAULT-KEY.txt)
//   VAULT_PIN_HASH  salt:sha256(salt:PIN)    (PIN from job-search/VAULT-PIN.txt)
// Every run picks a new salt, and the Worker counts wrong PINs per salt, so
// running this again also clears a lockout after too many wrong PINs.
//
//   npm run vault:secrets
//
// Values go to wrangler over stdin and are never printed.

import { readFile } from 'node:fs/promises'
import { createHash, randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const NOTES = join(ROOT, 'job-search')
const WORKER = join(ROOT, 'chatbot', 'backend')

const pin = (await readFile(join(NOTES, 'VAULT-PIN.txt'), 'utf8')).trim()
if (!/^\d{4,8}$/.test(pin)) throw new Error('VAULT-PIN.txt must hold a 4–8 digit PIN')
const rawKey = (await readFile(join(NOTES, 'VAULT-KEY.txt'), 'utf8')).trim()

const salt = randomBytes(16).toString('hex')
const hash = createHash('sha256').update(`${salt}:${pin}`).digest('hex')

function putSecret(name, value) {
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name], { cwd: WORKER, input: value, encoding: 'utf8' })
  if (r.status !== 0) throw new Error(`wrangler secret put ${name} failed:\n${r.stderr || r.stdout}`)
  console.log(`set ${name}`)
}

putSecret('VAULT_KEY', rawKey)
putSecret('VAULT_PIN_HASH', `${salt}:${hash}`)
console.log('Worker secrets updated; wrong-PIN counter starts fresh.')
