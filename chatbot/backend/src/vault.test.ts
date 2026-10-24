import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { checkPin, hashPin, MAX_ATTEMPTS, type CounterStorage } from './vault'

const KEY = 'data-key-base64'

function memoryStorage(): CounterStorage & { map: Map<string, unknown> } {
  const map = new Map<string, unknown>()
  return {
    map,
    async get<T>(k: string) { return map.get(k) as T | undefined },
    async put<T>(k: string, v: T) { map.set(k, v) },
    async delete(k: string) { return map.delete(k) },
  }
}

async function secretFor(pin: string, salt = 'a1b2c3') {
  return `${salt}:${await hashPin(salt, pin)}`
}

test('hash matches the one scripts/vault-secrets.mjs computes', async () => {
  const expected = createHash('sha256').update('somesalt:987654').digest('hex')
  assert.equal(await hashPin('somesalt', '987654'), expected)
})

test('right PIN returns the key', async () => {
  const r = await checkPin(memoryStorage(), await secretFor('987654'), KEY, '987654')
  assert.deepEqual(r, { status: 200, body: { key: KEY } })
})

test(`locks after ${MAX_ATTEMPTS} wrong PINs, even for the right PIN afterwards`, async () => {
  const s = memoryStorage()
  const secret = await secretFor('987654')
  assert.deepEqual(await checkPin(s, secret, KEY, '111111'), { status: 401, body: { error: 'wrong_pin', attemptsLeft: 2 } })
  assert.deepEqual(await checkPin(s, secret, KEY, '222222'), { status: 401, body: { error: 'wrong_pin', attemptsLeft: 1 } })
  assert.deepEqual(await checkPin(s, secret, KEY, '333333'), { status: 423, body: { error: 'locked' } })
  assert.deepEqual(await checkPin(s, secret, KEY, '987654'), { status: 423, body: { error: 'locked' } })
})

test('right PIN clears earlier wrong tries', async () => {
  const s = memoryStorage()
  const secret = await secretFor('987654')
  await checkPin(s, secret, KEY, '111111')
  await checkPin(s, secret, KEY, '222222')
  assert.equal((await checkPin(s, secret, KEY, '987654')).status, 200)
  assert.equal((await checkPin(s, secret, KEY, '111111')).body.attemptsLeft, 2)
})

test('a new salt (npm run vault:secrets) starts a fresh counter', async () => {
  const s = memoryStorage()
  const old = await secretFor('987654', 'oldsalt')
  for (const pin of ['1', '2', '3'].map((d) => d.repeat(6))) await checkPin(s, old, KEY, pin)
  assert.equal((await checkPin(s, old, KEY, '987654')).status, 423)
  assert.equal((await checkPin(s, await secretFor('987654', 'newsalt'), KEY, '987654')).status, 200)
})

test('malformed input is rejected without using an attempt', async () => {
  const s = memoryStorage()
  const secret = await secretFor('987654')
  for (const bad of [undefined, 987654, '', 'abcdef', '12', '123456789', '9876 54']) {
    assert.equal((await checkPin(s, secret, KEY, bad)).status, 400, String(bad))
  }
  assert.equal(s.map.size, 0)
})

test('missing secrets report not configured instead of opening', async () => {
  assert.equal((await checkPin(memoryStorage(), undefined, KEY, '987654')).status, 503)
  assert.equal((await checkPin(memoryStorage(), await secretFor('987654'), undefined, '987654')).status, 503)
})
