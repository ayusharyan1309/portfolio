// Minimal markdown renderer for the notes viewer: headings, lists, tables,
// quotes, inline code/bold/links. Fenced code blocks become copy cards, and
// {Placeholders} are filled from the viewer's fields before rendering; any
// left unfilled are highlighted so they're never sent by accident.

export const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Sentinel wrapping extracted code spans so later inline rules skip them.
const SENT = String.fromCharCode(1)
const SENT_RE = new RegExp(SENT + '(\\d+)' + SENT, 'g')

const placeholderRe = (keys) => (keys.length ? new RegExp(`\\{(${keys.join('|')})\\}`, 'g') : null)

/** Replaces {Key} with the field's value; empty fields stay as {Key}. */
export function fillPlaceholders(text, values) {
  return text.replace(/\{([A-Za-z]+)\}/g, (match, key) => {
    const v = values[key]
    return typeof v === 'string' && v.trim() ? v.trim() : match
  })
}

function markPlaceholders(html, re) {
  return re ? html.replace(re, '<mark class="ph">{$1}</mark>') : html
}

function inline(text, re) {
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
  t = markPlaceholders(t, re)
  t = t.replace(SENT_RE, (_, i) => `<code>${codes[+i]}</code>`)
  return t
}

const BLOCK_START = /^(\s*)(#{1,4}\s|>|---|\||```|[-*]\s|\d+\.\s)/
const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

function render(md, re, blocks) {
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
      const text = buf.join('\n')
      blocks.push(text)
      out.push(
        `<div class="copy-card"><button type="button" class="copy-btn" data-copy="${blocks.length - 1}">Copy</button>` +
        `<pre>${markPlaceholders(escapeHtml(text), re)}</pre></div>`
      )
      continue
    }
    if (/^---+\s*$/.test(line)) { out.push('<hr/>'); i++; continue }

    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      out.push(`<h${h[1].length}>${inline(escapeHtml(h[2]), re)}</h${h[1].length}>`)
      i++
      continue
    }

    if (/^\s*>/.test(line)) {
      const buf = []
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''))
      out.push(`<blockquote>${render(buf.join('\n'), re, blocks)}</blockquote>`)
      continue
    }

    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const head = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(splitRow(lines[i++]))
      out.push(
        '<div class="tbl"><table><thead><tr>' +
        head.map((c) => `<th>${inline(escapeHtml(c), re)}</th>`).join('') +
        '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + r.map((c) => `<td>${inline(escapeHtml(c), re)}</td>`).join('') + '</tr>').join('') +
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
          return `<li class="task"><input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}/> ${inline(escapeHtml(task[2]), re)}</li>`
        }
        return `<li>${inline(escapeHtml(it), re)}</li>`
      }).join('')
      out.push(ordered ? `<ol>${lis}</ol>` : `<ul>${lis}</ul>`)
      continue
    }

    const buf = [line]
    i++
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !BLOCK_START.test(lines[i])) buf.push(lines[i++])
    out.push(`<p>${inline(escapeHtml(buf.join(' ')), re)}</p>`)
  }
  return out.join('\n')
}

/**
 * Renders markdown to HTML. `blocks` holds each copy card's plain text, indexed
 * by the card button's data-copy attribute. `fieldKeys` lists the placeholder
 * names to highlight when still unfilled.
 */
export function renderMarkdown(md, fieldKeys = []) {
  const blocks = []
  const html = render(md, placeholderRe(fieldKeys), blocks)
  return { html, blocks }
}
