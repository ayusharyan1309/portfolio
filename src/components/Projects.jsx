import { useState } from 'react'
import { personalInfo, tracks } from '../data/portfolio'
import { GitHubIcon, ChatIcon, openChat } from './Icons'

const filters = [{ key: 'all', label: 'All' }, ...Object.entries(tracks).map(([key, t]) => ({ key, label: t.label }))]

export default function Projects() {
  const [filter, setFilter] = useState('all')
  const shown = personalInfo.projects.filter((p) => filter === 'all' || p.tracks.includes(filter))

  return (
    <section id="projects" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="heading">Projects</h2>
          <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1" role="group" aria-label="Filter projects">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                  filter === f.key ? 'bg-raised text-text' : 'text-muted hover:text-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="grid md:grid-cols-2 gap-x-10 border-t border-line">
          {shown.map((p) => (
            <li key={p.title} className="py-6 border-b border-line flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-xl font-semibold text-text leading-snug">{p.title}</h3>
                <span className="flex gap-1.5 pt-2 shrink-0">
                  {p.tracks.map((k) => (
                    <span key={k} className={`track-${k} h-2 w-2 rounded-sm bg-[var(--track)]`} aria-hidden="true" />
                  ))}
                  <span className="sr-only">{p.tracks.map((k) => tracks[k].label).join(', ')}</span>
                </span>
              </div>
              <p className={`mt-2 text-[0.9375rem] leading-relaxed text-soft ${p.featured ? '' : 'line-clamp-3'}`}>{p.description}</p>
              <p className="mt-3 text-sm text-muted">{p.stack}</p>

              {(p.github || p.tryIt) && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  {p.github && (
                    <a href={p.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-soft hover:text-text underline-offset-4 hover:underline">
                      <GitHubIcon size={15} /> Source
                    </a>
                  )}
                  {p.tryIt && (
                    <button type="button" onClick={() => openChat()} className="inline-flex items-center gap-1.5 text-lilac underline-offset-4 hover:underline cursor-pointer">
                      <ChatIcon size={15} /> Try it
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
