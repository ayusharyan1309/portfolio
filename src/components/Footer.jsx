import { personalInfo } from '../data/portfolio'

export default function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-2 justify-between text-sm text-muted">
        <p>© {new Date().getFullYear()} {personalInfo.name}</p>
        <p>Built with React and Vite. The chat assistant runs on Cloudflare Workers.</p>
      </div>
    </footer>
  )
}
