'use client'
import Modal from '@/app/components/Modal'
import { useState, useEffect } from 'react'

export default function EditPaymentModal({
  open,
  onClose,
  methods,
  item,
  onSave,
}: any) {
  const [pay, setPay] = useState('')
  const [inst, setInst] = useState(1)

  useEffect(() => {
    if (item) {
      setPay(item.payment_method_id ?? '')
      setInst(item.installments ?? 1)
    }
  }, [item])

  function handleSubmit(e: any) {
    e.preventDefault()
    onSave(pay, inst)
    onClose()
  }

  if (!item) return null

  const isCredit = methods.find((m: any) => m.id === pay)?.name?.toLowerCase().includes('crédito')

  return (
    <Modal open={open} onClose={onClose} title="Editar pagamento">
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          className="w-full border rounded p-2"
          value={pay}
          onChange={e => setPay(e.target.value)}
        >
          <option value="">Selecione método...</option>
          {methods.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {isCredit && (
          <select
            className="w-full border rounded p-2"
            value={inst}
            onChange={e => setInst(Number(e.target.value))}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}x
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border px-3 py-2 rounded">
            Cancelar
          </button>
          <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded">
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}
