import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encryptVault, generateKey, openVaultWithKey, isVault } from '../src/lib/vaultCrypto.js'
import { fillPlaceholders, renderMarkdown } from '../src/lib/vaultMarkdown.js'

const payload = { fields: [{ key: 'Company', label: 'Company', value: '' }], files: [{ name: 'Notes', content: 'Expected ₹15 LPA in Hyderabad' }] }

test('ciphertext round-trips and never contains the plaintext', async () => {
  const key = generateKey()
  const vault = await encryptVault(payload, key)
  assert.ok(isVault(vault))
  assert.ok(!JSON.stringify(vault).includes('Hyderabad'))
  assert.deepEqual(await openVaultWithKey(vault, key), payload)
})

test('a different key, or a re-keyed vault, fails to open', async () => {
  const key = generateKey()
  const vault = await encryptVault(payload, key)
  await assert.rejects(openVaultWithKey(vault, generateKey()))
  await assert.rejects(openVaultWithKey(await encryptVault(payload, generateKey()), key))
})

test('placeholders fill from fields; empty ones stay and are highlighted', () => {
  const md = 'Hi {Name},\n\n```\nApplying for {Role} at {Company}.\n```'
  const filled = fillPlaceholders(md, { Name: ' Priya ', Company: 'Zscaler', Role: '' })
  const { html, blocks } = renderMarkdown(filled, ['Name', 'Company', 'Role'])
  assert.equal(blocks[0], 'Applying for {Role} at Zscaler.')
  assert.ok(html.includes('Hi Priya,'))
  assert.ok(html.includes('<mark class="ph">{Role}</mark>'))
  assert.ok(html.includes('data-copy="0"'))
})

test('typed values are escaped in HTML but copied verbatim', () => {
  const md = '```\nAt {Company}\n```'
  const { html, blocks } = renderMarkdown(fillPlaceholders(md, { Company: '<img src=x onerror=alert(1)>' }), ['Company'])
  assert.ok(!html.includes('<img'))
  assert.equal(blocks[0], 'At <img src=x onerror=alert(1)>')
})
