import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { isVault, openVaultWithKey } from '../lib/vaultCrypto'
import { fillPlaceholders, renderMarkdown } from '../lib/vaultMarkdown'

// Hidden notes viewer. Opens on 5 quick taps of the navbar brand.
// public/vault.json is built by scripts/build-vault.mjs and holds only
// ciphertext. The chatbot Worker returns the key for the right PIN and locks
// after 3 wrong ones; the notes are decrypted here, in the browser.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const KEY_STORE = 'vault:key'
const FIELDS_STORE = 'vault:fields'

// Storage can be missing or throw (private mode, blocked site data).
const store = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* not persisted */ } },
  remove(k) { try { localStorage.removeItem(k) } catch { /* nothing to remove */ } },
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older mobile browsers: fall back to a temporary textarea.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

export default function SecretVault({ isOpen, onClose }) {
  const [state, setState] = useState('idle') // idle | loading | locked | unlocking | ready | missing | error
  const [vault, setVault] = useState(null)
  const [payload, setPayload] = useState(null)
  const [pin, setPin] = useState('')
  const [remember, setRemember] = useState(true)
  const [message, setMessage] = useState(null)
  const [active, setActive] = useState(0)
  const [values, setValues] = useState({})
  const [showFields, setShowFields] = useState(true)
  const loading = useRef(false)

  const load = useCallback(async () => {
    if (loading.current) return
    loading.current = true
    setState('loading')
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}vault.json`, { cache: 'no-store' })
      // The SPA rewrite answers missing files with index.html, so check the shape.
      const data = res.ok ? await res.json().catch(() => null) : null
      if (!isVault(data)) {
        setState('missing')
        return
      }
      setVault(data)
      const savedKey = store.get(KEY_STORE)
      if (savedKey) {
        try {
          setPayload(await openVaultWithKey(data, savedKey))
          setState('ready')
          return
        } catch {
          store.remove(KEY_STORE) // vault was re-keyed; ask for the PIN again
        }
      }
      setState('locked')
    } catch {
      setState('error')
    } finally {
      loading.current = false
    }
  }, [])

  useEffect(() => {
    if (isOpen && state === 'idle') load()
  }, [isOpen, state, load])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Field values: defaults from the vault, overridden by what was typed last time.
  useEffect(() => {
    if (!payload) return
    let saved = {}
    try { saved = JSON.parse(store.get(FIELDS_STORE) || '{}') } catch { /* ignore */ }
    const initial = {}
    for (const f of payload.fields || []) initial[f.key] = saved[f.key] ?? f.value ?? ''
    setValues(initial)
    // Start collapsed when details are already filled, so the notes get the screen.
    setShowFields(!initial.Company)
  }, [payload])

  const setField = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value }
      store.set(FIELDS_STORE, JSON.stringify(next))
      return next
    })
  }

  const unlock = async (e) => {
    e.preventDefault()
    if (!pin || !vault) return
    setState('unlocking')
    setMessage(null)
    try {
      const res = await fetch(`${API_URL}/api/vault/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const data = await res.json().catch(() => ({}))
      setPin('')
      if (res.status === 423) {
        setMessage('Locked after 3 wrong PINs.')
      } else if (res.status === 401) {
        setMessage(`Wrong PIN — ${data.attemptsLeft} ${data.attemptsLeft === 1 ? 'try' : 'tries'} left.`)
      } else if (!res.ok || !data.key) {
        setMessage('Enter the 6-digit PIN.')
      } else {
        const opened = await openVaultWithKey(vault, data.key)
        if (remember) store.set(KEY_STORE, data.key)
        setPayload(opened)
        setActive(0)
        setState('ready')
        return
      }
    } catch {
      setMessage("Couldn't reach the unlock service. Try again in a moment.")
    }
    setState('locked')
  }

  const lock = () => {
    store.remove(KEY_STORE)
    setPayload(null)
    setState('locked')
  }

  const files = payload?.files || []
  const fieldKeys = useMemo(() => (payload?.fields || []).map((f) => f.key), [payload])
  const doc = useMemo(
    () => renderMarkdown(fillPlaceholders(files[active]?.content || '', values), fieldKeys),
    [files, active, values, fieldKeys],
  )

  // Copy buttons live inside rendered HTML, so handle clicks by delegation.
  const onDocClick = async (e) => {
    const btn = e.target.closest('[data-copy]')
    if (!btn) return
    const ok = await copyText(doc.blocks[Number(btn.dataset.copy)] ?? '')
    btn.textContent = ok ? 'Copied' : 'Copy failed'
    setTimeout(() => { btn.textContent = 'Copy' }, 1500)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-surface w-full h-full sm:h-[88vh] sm:max-w-3xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/10 shrink-0">
          <span className="text-white font-semibold">Field Notes</span>
          <div className="flex items-center gap-2">
            {state === 'ready' && (
              <button
                onClick={lock}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                Lock
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xl"
            >
              &times;
            </button>
          </div>
        </div>

        {state === 'ready' ? (
          <>
            {fieldKeys.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFields((v) => !v)}
                aria-expanded={showFields}
                className="flex items-center justify-between gap-2 px-4 sm:px-6 pt-3 text-left text-xs text-gray-400 shrink-0"
              >
                <span className="truncate">
                  {showFields
                    ? 'Fill these once — every template updates'
                    : fieldKeys.map((k) => values[k]).filter(Boolean).join(' · ') || 'Fill in details'}
                </span>
                <span className="text-amber shrink-0">{showFields ? 'Hide' : 'Edit'}</span>
              </button>
            )}
            {fieldKeys.length > 0 && showFields && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-3 sm:px-5 pt-2 shrink-0">
                {payload.fields.map((f) => (
                  <label key={f.key} className="flex flex-col gap-1 text-[11px] text-gray-400">
                    {f.label}
                    <input
                      value={values[f.key] ?? ''}
                      onChange={(e) => setField(f.key, e.target.value)}
                      autoComplete="off"
                      className="rounded-md border border-white/10 bg-black/20 px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber"
                    />
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-1 px-3 sm:px-5 pt-3 overflow-x-auto shrink-0 border-b border-white/5">
              {files.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setActive(idx)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors ${
                    idx === active ? 'text-amber bg-white/5 border-b-2 border-amber' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <div
              className="vault-md flex-1 overflow-y-auto px-4 sm:px-6 py-5 text-[15px] leading-relaxed text-gray-300"
              onClick={onDocClick}
              dangerouslySetInnerHTML={{ __html: doc.html }}
            />
          </>
        ) : state === 'locked' || state === 'unlocking' ? (
          <form onSubmit={unlock} className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <p className="text-gray-400 text-sm text-center">Encrypted notes. Enter your PIN to open them.</p>
            <label htmlFor="vault-pin" className="sr-only">PIN</label>
            <input
              id="vault-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              autoComplete="off"
              autoFocus
              className="w-full max-w-[12rem] rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-center text-xl tracking-[0.4em] text-white focus:outline-none focus:border-amber"
            />
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember on this device
            </label>
            {message && <p className="text-sm text-red-400 text-center">{message}</p>}
            <button
              type="submit"
              disabled={state === 'unlocking' || !pin}
              className="px-5 py-2 text-sm font-semibold text-bg bg-amber rounded-lg hover:bg-amber/90 transition-all disabled:opacity-50"
            >
              {state === 'unlocking' ? 'Opening…' : 'Open'}
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {state === 'missing' ? (
              <p className="text-gray-400">No notes have been published.</p>
            ) : state === 'error' ? (
              <>
                <p className="text-gray-400">Couldn&apos;t load the notes.</p>
                <button
                  onClick={load}
                  className="px-5 py-2 text-sm font-semibold text-bg bg-amber rounded-lg hover:bg-amber/90 transition-all"
                >
                  Retry
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Loading…</p>
            )}
          </div>
        )}

        <style>{`
          .vault-md h1 { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 1.2em 0 0.5em; }
          .vault-md h2 { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 1.4em 0 0.4em; }
          .vault-md h3 { font-size: 1.02rem; font-weight: 600; color: var(--color-amber); margin: 1.1em 0 0.4em; }
          .vault-md h4 { font-size: 1rem; font-weight: 600; color: #fff; margin: 1em 0 0.3em; }
          .vault-md h1:first-child, .vault-md h2:first-child { margin-top: 0; }
          .vault-md p { margin: 0.6em 0; }
          .vault-md a { color: var(--color-amber); text-decoration: underline; word-break: break-word; }
          .vault-md code { background: rgba(255,255,255,0.08); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; }
          .vault-md .copy-card { position: relative; margin: 0.6em 0 1em; }
          .vault-md .copy-card pre { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.9em 1em; padding-top: 2.4em; white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 0.95em; line-height: 1.55; color: #e5e7eb; }
          .vault-md .copy-btn { position: absolute; top: 0.5em; right: 0.5em; padding: 0.3em 0.9em; font-size: 0.78rem; font-weight: 600; border-radius: 6px; background: var(--color-amber); color: #111; cursor: pointer; }
          .vault-md mark.ph { background: rgb(250 204 21 / 0.25); color: #fde68a; border-radius: 3px; padding: 0 0.15em; }
          .vault-md blockquote { border-left: 3px solid var(--color-amber); background: rgb(242 169 59 / 0.06); padding: 0.5em 1em; margin: 0.8em 0; border-radius: 0 8px 8px 0; }
          .vault-md blockquote p { margin: 0.4em 0; }
          .vault-md ul, .vault-md ol { margin: 0.6em 0; padding-left: 1.4em; }
          .vault-md ul { list-style: disc; }
          .vault-md ol { list-style: decimal; }
          .vault-md li { margin: 0.35em 0; }
          .vault-md li.task { list-style: none; margin-left: -1.2em; }
          .vault-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 1.4em 0; }
          .vault-md .tbl { overflow-x: auto; margin: 0.8em 0; }
          .vault-md table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
          .vault-md th, .vault-md td { border: 1px solid rgba(255,255,255,0.12); padding: 0.45em 0.7em; text-align: left; vertical-align: top; }
          .vault-md th { background: rgba(255,255,255,0.06); color: #fff; }
          .vault-md strong { color: #fff; }
        `}</style>
      </div>
    </div>
  )
}
