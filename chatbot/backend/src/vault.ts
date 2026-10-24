/**
 * PIN unlock for the encrypted notes viewer on the portfolio site.
 *
 * The notes ship as ciphertext (public/vault.json on the site). The data key
 * never ships: it lives here as the VAULT_KEY secret and is returned only for
 * the right PIN. Wrong PINs are capped at MAX_ATTEMPTS in total; after that
 * the vault stays locked until the owner runs `npm run vault:secrets` in the
 * portfolio root, which sets a new salt and so starts a fresh counter.
 *
 * The count lives in a Durable Object, so the limit holds across every Worker
 * instance, and requests are handled one at a time so parallel guesses can't
 * slip past it.
 */

export const MAX_ATTEMPTS = 3

export interface CounterStorage {
  get<T>(key: string): Promise<T | undefined>
  put<T>(key: string, value: T): Promise<void>
  delete(key: string): Promise<boolean>
}

export type UnlockResult =
  | { status: 200; body: { key: string } }
  | { status: 401; body: { error: 'wrong_pin'; attemptsLeft: number } }
  | { status: 423; body: { error: 'locked' } }
  | { status: 400 | 503; body: { error: string } }

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** sha256("salt:pin") as hex — scripts/vault-secrets.mjs computes the same. */
export async function hashPin(salt: string, pin: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`)))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** The whole check, free of Durable Object plumbing so it can be unit-tested. */
export async function checkPin(
  storage: CounterStorage,
  pinHashSecret: string | undefined,
  vaultKey: string | undefined,
  pin: unknown
): Promise<UnlockResult> {
  const [salt, expected] = (pinHashSecret ?? '').split(':')
  if (!salt || !expected || !vaultKey) return { status: 503, body: { error: 'not_configured' } }
  // Malformed input never reaches the counter.
  if (typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) return { status: 400, body: { error: 'bad_pin_format' } }

  const counterKey = `fails:${salt}`
  const fails = (await storage.get<number>(counterKey)) ?? 0
  if (fails >= MAX_ATTEMPTS) return { status: 423, body: { error: 'locked' } }

  if (timingSafeEqual(await hashPin(salt, pin), expected)) {
    if (fails) await storage.delete(counterKey)
    return { status: 200, body: { key: vaultKey } }
  }

  await storage.put(counterKey, fails + 1)
  const attemptsLeft = MAX_ATTEMPTS - (fails + 1)
  return attemptsLeft > 0
    ? { status: 401, body: { error: 'wrong_pin', attemptsLeft } }
    : { status: 423, body: { error: 'locked' } }
}

interface VaultEnv {
  VAULT_KEY?: string
  VAULT_PIN_HASH?: string
}

export class VaultLock {
  constructor(private state: DurableObjectState, private env: VaultEnv) {}

  async fetch(request: Request): Promise<Response> {
    const { pin } = (await request.json().catch(() => ({}))) as { pin?: unknown }
    const result = await this.state.blockConcurrencyWhile(() =>
      checkPin(this.state.storage, this.env.VAULT_PIN_HASH, this.env.VAULT_KEY, pin)
    )
    return Response.json(result.body, { status: result.status })
  }
}
