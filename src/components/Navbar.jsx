import { useState, useEffect, useRef } from 'react'
import { personalInfo } from '../data/portfolio'

const navItems = [
  { label: 'Experience', href: '#experience' },
  { label: 'Systems', href: '#systems' },
  { label: 'Projects', href: '#projects' },
  { label: 'Skills', href: '#skills' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar({ onOpenVault }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const brandClicks = useRef(0)
  const lastBrandClick = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)
      const sections = navItems.map((item) => item.href.slice(1)).reverse()
      let current = 'hero'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) {
          current = id
          break
        }
      }
      setActiveSection(current)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Five quick taps on the name open the encrypted notes viewer.
  const handleBrandClick = () => {
    setMobileOpen(false)
    const now = Date.now()
    if (now - lastBrandClick.current > 2500) brandClicks.current = 0
    lastBrandClick.current = now
    brandClicks.current += 1
    if (brandClicks.current >= 5) {
      brandClicks.current = 0
      onOpenVault?.()
    }
  }

  const linkClass = (href) =>
    activeSection === href.slice(1) ? 'text-text' : 'text-muted hover:text-text'

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileOpen ? 'bg-bg/85 backdrop-blur-md border-b border-line' : 'border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href="#hero"
          onClick={handleBrandClick}
          className="font-display text-lg font-semibold text-text select-none"
        >
          {personalInfo.name}
        </a>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activeSection === item.href.slice(1) ? 'true' : undefined}
              className={`px-3 py-2 text-sm transition-colors ${linkClass(item.href)}`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={personalInfo.resumeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 btn btn-primary !py-2 !text-sm"
          >
            Resume
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 -mr-2 flex items-center justify-center cursor-pointer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className="relative block w-5 h-3">
            <span className={`absolute left-0 w-5 h-[1.5px] bg-text transition-transform ${mobileOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 w-5 h-[1.5px] bg-text transition-transform ${mobileOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line px-4 pb-4 pt-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-3 text-base border-b border-line ${linkClass(item.href)}`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={personalInfo.resumeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 btn btn-primary w-full justify-center"
          >
            Resume
          </a>
        </div>
      )}
    </nav>
  )
}
