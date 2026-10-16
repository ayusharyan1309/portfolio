import { personalInfo } from '../data/portfolio'

export default function Skills() {
  const { skills, education } = personalInfo

  return (
    <section id="skills" className="py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="heading mb-10">Skills</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
          {skills.map((s) => (
            <div key={s.group} className={s.track ? `track-${s.track}` : ''}>
              <h3 className={`text-base font-semibold ${s.track ? 'text-[var(--track)]' : 'text-text'}`}>{s.group}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <li key={item} className={`chip ${s.track ? `track-${s.track}` : ''}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}

          <div id="education">
            <h3 className="text-base font-semibold text-text">Education</h3>
            <p className="mt-3 text-soft leading-snug">{education.degree}</p>
            <p className="mt-1 text-sm text-muted">
              {education.school}, {education.period}
            </p>
            <p className="mt-2 text-sm text-muted">{education.coursework.join(', ')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
