'use client'
import Modal from '@/app/components/Modal'
import { useState } from 'react'

export default function FinalizeModal({ open, onClose, methods, onConfirm }: any) {
  const [paymentId, setPaymentId] = useState('')
  const [installments, setInstallments] = useState(1)

  const isCredit = methods.find((m: any) => m.id === paymentId)?.name?.toLowerCase().includes('crédito')

  function handleSubmit(e: any) {
    e.preventDefault()
    onConfirm(paymentId, installments)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Finalizar compra">
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          className="w-full border rounded p-2"
          value={paymentId}
          onChange={e => setPaymentId(e.target.value)}
        >
          <option value="">Selecione...</option>
          {methods.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {isCredit && (
          <select
            className="w-full border rounded p-2"
            value={installments}
            onChange={e => setInstallments(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}x
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="border px-3 py-2 rounded">
            Cancelar
          </button>
          <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded">
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  )
}
