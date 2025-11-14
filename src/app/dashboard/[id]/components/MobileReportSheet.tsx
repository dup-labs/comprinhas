// MobileReportSheet.tsx
'use client'

import { useEffect } from 'react'

export default function MobileReportSheet({ open, onClose, children }: any) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* sheet */}
      <div className="
        absolute bottom-0 left-0 right-0
         bg-five-gray-light rounded-t-3xl p-6
        max-h-[90vh] overflow-y-auto
        shadow-xl
        animate-slideUp
      ">
        <div className="w-full flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {children}
      </div>
    </div>
  )
}
