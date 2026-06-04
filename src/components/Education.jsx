import { personalInfo } from '../data/portfolio'

export default function Education() {
  const { education } = personalInfo

  return (
    <section id="education" className="relative py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="section-title">Education</h2>

        <div
          className="glass-card rounded-2xl overflow-hidden"
          itemScope
          itemType="https://schema.org/EducationalOccupationalCredential"
        >
          <meta itemProp="educationalLevel" content="Bachelor's Degree" />

          <div className="grid md:grid-cols-5 gap-0">
            {/* Logo */}
            <div
              className="md:col-span-2 bg-white/5 p-8 flex items-center justify-center"
              itemProp="recognizedBy"
              itemScope
              itemType="https://schema.org/CollegeOrUniversity"
            >
              <meta itemProp="name" content={education.school} />
              <img
                src={education.logo}
                alt={`${education.school} — B.Tech in Data Science and Artificial Intelligence`}
                className="max-w-[200px] h-auto"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Details */}
            <div className="md:col-span-3 p-6 sm:p-8 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white" itemProp="credentialCategory">{education.degree}</h3>
                <p className="text-sm text-[#12d640] font-medium mt-1">{education.school}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                  {education.period}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#12d640]/10 text-[#12d640] border border-[#12d640]/20">
                  {education.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-200 mb-2">Relevant Coursework</p>
                <div className="flex flex-wrap gap-2">
                  {education.coursework.map((course) => (
                    <span key={course} className="skill-tag text-xs">
                      {course}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
