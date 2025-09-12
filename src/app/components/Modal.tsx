'use client'

import { useEffect, useState, type ReactNode, useRef } from 'react'
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** fecha ao clicar no fundo (default: true) */
  closeOnBackdrop?: boolean
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  closeOnBackdrop = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // monta portal só no client
  useEffect(() => setMounted(true), [])

  // bloqueia scroll do body quando aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // ESC para fechar
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted || !open) return null

  const content = (
    <div
      aria-modal="true"
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => {
        // clique fora do painel
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* painel */}
      <div
        ref={panelRef}
        className="relative z-10 w-[520px] max-w-[95vw] rounded-xl bg-white p-5 shadow-[0_20px_60px_-10px_rgb(0_0_0/.35)]"
      >
        <div className="mb-4 flex items-center justify-between">
          {title ? <h3 className="text-lg font-semibold">{title}</h3> : <div />}
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}