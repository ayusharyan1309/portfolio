import { useState } from 'react'
import { personalInfo } from '../data/portfolio'
import { CheckIcon, CopyIcon, FileIcon, MailIcon, socialIcons } from './Icons'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(personalInfo.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${personalInfo.email}`
    }
  }

  return (
    <section id="contact" className="mt-10 py-20 sm:py-24 border-t border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="font-display font-bold text-text text-[clamp(2.25rem,6vw,4rem)] leading-[1.02] tracking-[-0.015em] max-w-[18ch]">
          Hiring for Java backend or GenAI?
        </h2>
        <p className="lede mt-4 text-lg">
          Email is the fastest way to reach me. I’m based in {personalInfo.location} and open to full-time roles.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a
            href={`mailto:${personalInfo.email}`}
            className="font-display text-[clamp(1.25rem,3.5vw,2rem)] font-semibold text-amber underline decoration-amber/40 underline-offset-[6px] hover:decoration-amber break-all"
          >
            {personalInfo.email}
          </a>
          <button type="button" onClick={copyEmail} className="btn !py-2 !text-sm" aria-live="polite">
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href={`mailto:${personalInfo.email}`} className="btn btn-primary">
            <MailIcon /> Email me
          </a>
          <a href={personalInfo.resumeLink} target="_blank" rel="noopener noreferrer" className="btn">
            <FileIcon /> Resume
          </a>
          {personalInfo.socialLinks.map((link) => {
            const Icon = socialIcons[link.icon]
            return (
              <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="btn">
                <Icon size={16} /> {link.name}
              </a>
            )
          })}
        </div>

        <p className="mt-8 text-sm text-muted">
          Phone{' '}
          <a href={`tel:${personalInfo.phone.replace(/\s/g, '')}`} className="text-soft hover:text-text">
            {personalInfo.phone}
          </a>
        </p>
      </div>
    </section>
  )
}
