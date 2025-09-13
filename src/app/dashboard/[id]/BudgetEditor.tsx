'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase-browser'
import Modal from '@/app/components/Modal'
import { useDisclosure } from '@/hooks/useDisclosure'

export default function BudgetEditor({
  listId,
  initialBudgetCents,
}: {
  listId: string
  initialBudgetCents: number
}) {
  const supabase = createClientBrowser()
  const router = useRouter()
  const modal = useDisclosure(false)
  const [value, setValue] = useState(
    (initialBudgetCents / 100).toFixed(2).replace('.', ',')
  )

  const toCents = (input: string): number => {
    const cleaned = input.replace(/[^\d.,-]/g, '')
    const decimal = cleaned.includes(',') && !cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned
    const n = parseFloat(decimal || '0')
    return Math.round(n * 100)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const cents = toCents(value)
    const { error } = await supabase
      .from('lists')
      .update({ monthly_budget_cents: cents })
      .eq('id', listId)

    if (error) {
      alert(error.message)
      return
    }
    modal.closeModal()
    router.refresh() // recarrega server components: header/summary/etc
  }

  return (
    <>
      <button
        className="rounded border px-3 py-2"
        onClick={modal.openModal}
      >
        Editar orçamento
      </button>

      <Modal open={modal.open} onClose={modal.closeModal} title="Editar orçamento">
        <form onSubmit={save} className="space-y-3" key={modal.open ? 'open' : 'closed'}>
          <label className="block">
            <span className="text-sm">Orçamento mensal (R$)</span>
            <input
              className="mt-1 w-full rounded border p-2"
              inputMode="decimal"
              placeholder="ex: 500,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={modal.closeModal} className="border px-3 py-2 rounded">
              Cancelar
            </button>
            <button type="submit" className="bg-black text-white px-3 py-2 rounded">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
