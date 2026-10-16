import { tracks } from '../data/portfolio'
import { ChatIcon, openChat } from './Icons'

// Simplified views of two real systems. Keep node labels factual: these are
// read by engineers who will ask about them in interviews.
const systems = [
  {
    track: 'backend',
    title: 'Real-time safety alerts',
    where: 'Visionify',
    summary: 'Turns workplace-safety events from computer-vision models into notifications on the channels each site already uses.',
    nodes: [
      { name: 'Safety events', detail: 'from CV models' },
      { name: 'Kafka', detail: 'event topics' },
      { name: 'Alert service', detail: 'Spring Boot, Redis' },
      { name: 'Channels', detail: 'Email, Teams, WhatsApp' },
    ],
    facts: ['10K+ events a day', 'API responses under 150 ms', 'Fault-tolerant routing at peak'],
  },
  {
    track: 'ai',
    title: 'RAG assistant on this site',
    where: 'Personal project',
    summary: 'Answers questions about my work from my resume and project write-ups, not from a model’s general memory.',
    nodes: [
      { name: 'Question', detail: 'chat widget' },
      { name: 'Embed', detail: 'bge-small on Workers AI' },
      { name: 'Retrieve', detail: 'top 5 chunks by cosine' },
      { name: 'Generate', detail: 'Groq, gpt-oss-20b' },
      { name: 'Stream', detail: 'SSE to the browser' },
    ],
    facts: ['Serverless on Cloudflare Workers', 'Swappable LLM providers', 'Free-tier hosting'],
    action: true,
  },
]

function Arrow() {
  return (
    <>
      <svg className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 text-muted" width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
        <path d="M0 6h20M16 1.5 21 6l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <svg className="md:hidden absolute left-6 -bottom-6 text-muted" width="12" height="24" viewBox="0 0 12 24" aria-hidden="true">
        <path d="M6 0v20M1.5 16 6 21l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </>
  )
}

export default function Systems() {
  return (
    <section id="systems" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="heading">Systems I’ve built</h2>
        <p className="lede mt-3">Simplified views of one production backend and one GenAI pipeline, end to end.</p>

        <div className="mt-10 space-y-6">
          {systems.map((s) => (
            <article
              key={s.title}
              className={`track-${s.track} rounded-xl border border-line bg-surface/60 p-5 sm:p-7 border-t-2 [border-top-color:var(--track)]`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-2xl font-semibold text-text">{s.title}</h3>
                <p className="text-sm text-[var(--track)]">
                  {tracks[s.track].label}, {s.where}
                </p>
              </div>
              <p className="mt-2 text-soft max-w-[68ch]">{s.summary}</p>

              <ol className="mt-7 flex flex-col md:flex-row gap-6">
                {s.nodes.map((n, i) => (
                  <li key={n.name} className="relative flex-1 rounded-lg border border-line bg-bg px-4 py-3">
                    <p className="font-mono text-sm text-text">{n.name}</p>
                    <p className="mt-0.5 text-sm text-muted">{n.detail}</p>
                    {i < s.nodes.length - 1 && <Arrow />}
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <ul className="flex flex-wrap gap-2">
                  {s.facts.map((f) => (
                    <li key={f} className={`chip track-${s.track}`}>{f}</li>
                  ))}
                </ul>
                {s.action && (
                  <button type="button" onClick={() => openChat()} className="btn !border-lilac/50 !text-lilac hover:!bg-lilac/10">
                    <ChatIcon size={16} /> Ask the assistant
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
