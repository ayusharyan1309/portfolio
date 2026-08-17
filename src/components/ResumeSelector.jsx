import { useEffect, useRef } from 'react'

// Production resume link — from Google Drive
const RESUME_LINK = 'https://drive.google.com/file/d/1Q8hGu1eM2ooj7_VvSbKbA9jwKE7DPm3h/view?usp=sharing'

export default function ResumeSelector({ isOpen, onClose }) {
  const modalRef = useRef(null)

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
  const handleOpen = () => {
    window.open(RESUME_LINK, '_blank', 'noopener,noreferrer')
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
            <h2 className="text-white font-semibold text-base">📄 Resume</h2>
            <p className="text-xs text-gray-500 mt-0.5">View or download</p>
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
          <button
            onClick={handleOpen}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-[#12d640]/30 hover:bg-[#12d640]/[0.03] transition-all text-left group"
          >
            <span className="text-2xl">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium group-hover:text-[#12d640] transition-colors">
                Resume
              </p>
              <p className="text-xs text-gray-500 mt-0.5">View or download</p>
            </div>
            <div className="shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 group-hover:text-[#12d640] transition-colors">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-600 text-center">
            Hosted on Google Drive
          </p>
        </div>
      </div>
    </div>
  )
}
