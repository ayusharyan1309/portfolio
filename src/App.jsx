import { useState } from 'react'
import { seoJsonLd } from './data/portfolio'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Experience from './components/Experience'
import Systems from './components/Systems'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'
import SecretVault from './components/SecretVault'

export default function App() {
  const [showVault, setShowVault] = useState(false)

  return (
    <>
      <a href="#hero" className="skip-nav">
        Skip to content
      </a>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoJsonLd) }} />

      <div className="min-h-screen bg-bg text-text">
        <Navbar onOpenVault={() => setShowVault(true)} />
        <main>
          <Hero />
          <Experience />
          <Systems />
          <Projects />
          <Skills />
          <Contact />
        </main>
        <Footer />

        <Chatbot />

        {/* Hidden notes viewer (5 taps on the navbar name) */}
        <SecretVault isOpen={showVault} onClose={() => setShowVault(false)} />
      </div>
    </>
  )
}
