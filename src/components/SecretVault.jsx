import { useState, useEffect, useRef, useCallback } from 'react'

// Hidden notes viewer. Opens on 5 quick taps of the navbar brand.
// Content is built into public/content-cache.json by job-search/build-vault.mjs.
// The JSON is plaintext and publicly fetchable — see that script's header.

// --- minimal markdown renderer (headings, lists, tables, quotes, inline) ---

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Sentinel wrapping extracted code spans so later inline rules skip them.
const SENT = String.fromCharCode(1)
const SENT_RE = new RegExp(SENT + '(\\d+)' + SENT, 'g')

function inline(text) {
  const codes = []
  let t = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c)
    return SENT + (codes.length - 1) + SENT
  })
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  t = t.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2" target="_blank" rel="noreferrer">$2</a>')
  t = t.replace(SENT_RE, (_, i) => `<code>${codes[+i]}</code>`)
  return t
}

const BLOCK_START = /^(\s*)(#{1,4}\s|>|---|\||```|[-*]\s|\d+\.\s)/
const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

function mdToHtml(md) {
  const lines = md.split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*$/.test(line)) { i++; continue }

    if (/^```/.test(line)) {
      const buf = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++])
      i++
      out.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`)
      continue
    }
    if (/^---+\s*$/.test(line)) { out.push('<hr/>'); i++; continue }

    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      out.push(`<h${h[1].length}>${inline(escapeHtml(h[2]))}</h${h[1].length}>`)
      i++
      continue
    }

    if (/^\s*>/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''))
      out.push(`<blockquote>${mdToHtml(buf.join('\n'))}</blockquote>`)
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const head = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(splitRow(lines[i++]))
      out.push(
        '<div class="tbl"><table><thead><tr>' +
        head.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>'
      )
      continue
    }

    const ordered = /^\s*\d+\.\s+/.test(line)
    const listRe = ordered ? /^\s*\d+\.\s+(.*)$/ : /^\s*[-*]\s+(.*)$/
    if (listRe.test(line)) {
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(listRe)
        if (!m) break
        items.push(m[1])
        i++
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !BLOCK_START.test(lines[i].trim())) {
          items[items.length - 1] += ' ' + lines[i++].trim()
        }
      }
      const lis = items.map((it) => {
        const task = it.match(/^\[([ xX])\]\s+(.*)$/)
        if (task) {
          return `<li class="task"><input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}/> ${inline(escapeHtml(task[2]))}</li>`
        }
        return `<li>${inline(escapeHtml(it))}</li>`
      }).join('')
      out.push(ordered ? `<ol>${lis}</ol>` : `<ul>${lis}</ul>`)
      continue
    }

    const buf = [line]
    i++
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) buf.push(lines[i++])
    out.push(`<p>${inline(escapeHtml(buf.join(' ')))}</p>`)
  }
  return out.join('\n')
}

const prettyName = (name) => name.replace(/\.md$/, '').replace(/[-_]/g, ' ')

export default function SecretVault({ isOpen, onClose }) {
  const [state, setState] = useState('idle') // idle | loading | ready | error
  const [files, setFiles] = useState([])
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async () => {
    if (loaded.current) return
    loaded.current = true
    setState('loading')
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}content-cache.json`, { cache: 'no-store' })
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setFiles(data.files || [])
      setActive(0)
      setState('ready')
    } catch {
      loaded.current = false
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen, load])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const copyRaw = async () => {
    try {
      await navigator.clipboard.writeText(files[active]?.content || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-stretch sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0f24] w-full h-full sm:h-[85vh] sm:max-w-3xl sm:rounded-2xl border border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/10 shrink-0">
          <span className="text-white font-semibold">Field Notes</span>
          <div className="flex items-center gap-2">
            {state === 'ready' && (
              <button
                onClick={copyRaw}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {copied ? 'Copied' : 'Copy raw'}
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
            <div className="flex gap-1 px-3 sm:px-5 pt-3 overflow-x-auto shrink-0">
              {files.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setActive(idx)}
                  className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap capitalize transition-colors ${
                    idx === active
                      ? 'text-[#12d640] bg-white/5 border-b-2 border-[#12d640]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {prettyName(f.name)}
                </button>
              ))}
            </div>
            <div
              className="vault-md flex-1 overflow-y-auto px-4 sm:px-6 py-5 text-[15px] leading-relaxed text-gray-300"
              dangerouslySetInnerHTML={{ __html: mdToHtml(files[active]?.content || '') }}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            {state === 'error' ? (
              <>
                <p className="text-gray-400">Couldn&apos;t load the notes.</p>
                <button
                  onClick={load}
                  className="px-5 py-2 text-sm font-semibold text-[#0a0a1a] bg-[#12d640] rounded-lg hover:bg-[#12d640]/90 transition-all"
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
          .vault-md h2 { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 1.2em 0 0.4em; }
          .vault-md h3 { font-size: 1.05rem; font-weight: 600; color: #12d640; margin: 1.1em 0 0.4em; }
          .vault-md h4 { font-size: 1rem; font-weight: 600; color: #fff; margin: 1em 0 0.3em; }
          .vault-md h1:first-child, .vault-md h2:first-child { margin-top: 0; }
          .vault-md p { margin: 0.6em 0; }
          .vault-md a { color: #12d640; text-decoration: underline; }
          .vault-md code { background: rgba(255,255,255,0.08); padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.88em; }
          .vault-md pre { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.8em 1em; overflow-x: auto; margin: 0.8em 0; }
          .vault-md pre code { background: none; padding: 0; }
          .vault-md blockquote { border-left: 3px solid #12d640; background: rgba(18,214,64,0.06); padding: 0.5em 1em; margin: 0.8em 0; border-radius: 0 8px 8px 0; }
          .vault-md blockquote p { margin: 0.4em 0; }
          .vault-md ul, .vault-md ol { margin: 0.6em 0; padding-left: 1.4em; }
          .vault-md ul { list-style: disc; }
          .vault-md ol { list-style: decimal; }
          .vault-md li { margin: 0.35em 0; }
          .vault-md li.task { list-style: none; margin-left: -1.2em; }
          .vault-md hr { border: none; border-top: 1px solid rgba(255,255,255,0.12); margin: 1.4em 0; }
          .vault-md .tbl { overflow-x: auto; margin: 0.8em 0; }
          .vault-md table { border-collapse: collapse; width: 100%; font-size: 0.9em; }
          .vault-md th, .vault-md td { border: 1px solid rgba(255,255,255,0.12); padding: 0.45em 0.7em; text-align: left; }
          .vault-md th { background: rgba(255,255,255,0.06); color: #fff; }
          .vault-md strong { color: #fff; }
        `}</style>
      </div>
    </div>
  )
}
