import { personalInfo, tracks } from '../data/portfolio'

export function TrackLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {['backend', 'ai'].map((key) => (
        <span key={key} className={`track-${key} inline-flex items-center gap-2`}>
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--track)]" aria-hidden="true" />
          {tracks[key].label}
        </span>
      ))}
    </div>
  )
}

export default function Experience() {
  return (
    <section id="experience" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <h2 className="heading">Experience</h2>
          <TrackLegend />
        </div>

        <ol className="border-t border-line">
          {personalInfo.experience.map((exp) => (
            <li key={exp.company} className="grid grid-cols-1 md:grid-cols-[12rem_1fr] gap-x-10 gap-y-3 py-8 border-b border-line">
              <p className="text-sm text-muted tabular-nums md:pt-1.5">{exp.period}</p>

              <div>
                <h3 className="font-display text-2xl font-semibold text-text">
                  {exp.url ? (
                    <a href={exp.url} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-4 decoration-line">
                      {exp.company}
                    </a>
                  ) : (
                    exp.company
                  )}
                </h3>
                <p className="mt-0.5 text-soft">{exp.role}</p>

                <ul className="mt-5 space-y-3 max-w-[75ch]">
                  {exp.highlights.map((h, i) => (
                    <li key={i} className={`track-${h.track} relative pl-5 text-[0.9375rem] leading-relaxed text-soft`}>
                      <span className="absolute left-0 top-[0.6em] h-2 w-2 rounded-sm bg-[var(--track)]" aria-hidden="true" />
                      <span className="sr-only">{tracks[h.track].label}: </span>
                      <span className="[&_strong]:text-text [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: h.text }} />
                    </li>
                  ))}
                </ul>

                <p className="mt-5 text-sm text-muted">{exp.stack}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
