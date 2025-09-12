'use client'
import { useState } from 'react'

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)
  return {
    open,
    openModal: () => setOpen(true),
    closeModal: () => setOpen(false),
    toggleModal: () => setOpen((v) => !v),
    setOpen,
  }
}