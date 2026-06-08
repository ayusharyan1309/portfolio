import { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

// Production resume links — always shown, from Google Drive
const FALLBACK_RESUMES = [
  {
    id: 'flutter-dev',
    label: 'Flutter / Mobile Developer',
    icon: '📱',
    url: 'https://drive.google.com/file/d/1Fng2FnqMal5IVpavAlG7iQfyUXQJUc5k/view?usp=sharing',
    subtitle: 'Flutter, Dart, Mobile Apps',
  },
  {
    id: 'java-ai-dev',
    label: 'Java + AI / Backend Engineer',
    icon: '☕',
    url: 'https://drive.google.com/file/d/1Q8hGu1eM2ooj7_VvSbKbA9jwKE7DPm3h/view?usp=sharing',
    subtitle: 'Java, Spring Boot, AI/ML, Distributed Systems',
  },
]

export default function ResumeSelector({ isOpen, onClose }) {
  const [profiles, setProfiles] = useState(null)
  const [loading, setLoading] = useState(false)
  const [backendAvailable, setBackendAvailable] = useState(null)
  const [downloading, setDownloading] = useState(null)
  const modalRef = useRef(null)

  // Fetch profiles when modal opens
  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    setProfiles(null)
    setBackendAvailable(null)

    fetch(`${API_URL}/api/admin/profiles`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const uploaded = data.profiles.filter((p) => p.uploaded_at)
        setBackendAvailable(true)
        setProfiles(uploaded)
        setLoading(false)
      })
      .catch((e) => {
        setBackendAvailable(false)
        setProfiles([])
        setLoading(false)
      })
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Open Drive link
  const handleDriveOpen = (profile) => {
    window.open(profile.url, '_blank', 'noopener,noreferrer')
  }

  // Download from backend
  const handleDownload = async (profile) => {
    setDownloading(profile.id)
    try {
      const res = await fetch(`${API_URL}/api/resume/${profile.id}/download`)
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = profile.file_name || `${profile.label.toLowerCase().replace(/\s+/g, '-')}-resume.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      if (profile.cloud_url) {
        window.open(profile.cloud_url, '_blank')
      }
    } finally {
      setDownloading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold text-base">📄 Select Resume</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choose a resume to view or download</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-[#12d640] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading resumes...</p>
            </div>
          )}

          {/* Show content when not loading */}
          {!loading && (
            <>
              {/* Locally uploaded profiles (from Python backend) */}
              {backendAvailable && profiles?.length > 0 && (
                <div className="mb-4">
                  {backendAvailable && profiles?.length > 0 && (
                    <p className="text-[11px] text-gray-600 font-medium uppercase tracking-wider mb-2 px-1">
                      Uploaded Resumes
                    </p>
                  )}
                  <div className="space-y-2">
                    {profiles.map((p) => {
                      const isDownloading = downloading === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleDownload(p)}
                          disabled={isDownloading}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all disabled:opacity-50 text-left group"
                        >
                          <span className="text-2xl">{p.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium group-hover:text-[#12d640] transition-colors">
                              {p.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {p.file_name || 'Resume PDF'} • {new Date(p.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="shrink-0">
                            {isDownloading ? (
                              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="#12d640" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#12d640] transition-colors">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Always-available Drive-based resumes */}
              <div>
                {backendAvailable && profiles?.length > 0 && (
                  <p className="text-[11px] text-gray-600 font-medium uppercase tracking-wider mb-2 px-1">
                    Also Available
                  </p>
                )}
                <div className="space-y-2">
                  {FALLBACK_RESUMES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleDriveOpen(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium group-hover:text-[#12d640] transition-colors">
                          {p.label}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{p.subtitle}</p>
                      </div>
                      <div className="shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#12d640] transition-colors">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-600 text-center">
            Resumes hosted on Google Drive
          </p>
        </div>
      </div>
    </div>
  )
}
