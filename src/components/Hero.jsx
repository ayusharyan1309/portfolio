import { personalInfo } from '../data/portfolio'
import ApiConsole from './ApiConsole'
import { FileIcon, LinkedInIcon, MailIcon } from './Icons'

export default function Hero() {
  const linkedin = personalInfo.socialLinks.find((l) => l.icon === 'linkedin')

  return (
    <section id="hero" tabIndex={-1} className="relative pt-28 sm:pt-36 pb-6 outline-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-14 items-center">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-soft">
            <span className="h-2 w-2 rounded-full bg-amber" aria-hidden="true" />
            {personalInfo.lookingFor}
          </p>

          <h1 className="mt-6 font-display font-bold text-text text-[clamp(3.25rem,9vw,6.25rem)] leading-[0.92] tracking-[-0.02em]">
            {personalInfo.name}
          </h1>
          <p className="mt-3 font-display text-[clamp(1.375rem,2.6vw,1.875rem)] leading-tight text-soft">
            {personalInfo.role}
          </p>

          <p className="mt-6 text-lg leading-relaxed text-soft max-w-[52ch]">{personalInfo.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${personalInfo.email}`} className="btn btn-primary">
              <MailIcon /> Email me
            </a>
            <a href={personalInfo.resumeLink} target="_blank" rel="noopener noreferrer" className="btn">
              <FileIcon /> Resume
            </a>
            <a href={linkedin.url} target="_blank" rel="noopener noreferrer" className="btn">
              <LinkedInIcon size={16} /> LinkedIn
            </a>
          </div>

          <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
            <span>{personalInfo.currentRole}</span>
            <span>{personalInfo.location}</span>
          </p>
        </div>

        <ApiConsole />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16 sm:mt-20">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-line">
          {personalInfo.proof.map((p) => (
            <div key={p.value} className="pt-6 pb-2 sm:pr-8">
              <dt className="font-display text-3xl font-semibold text-text tabular-nums">{p.value}</dt>
              <dd className="mt-1 text-sm leading-snug text-muted">{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
