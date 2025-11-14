'use client'
import Modal from '@/app/components/Modal'
import { useState, useEffect } from 'react'

export default function EditCategoryModal({
  open,
  onClose,
  item,
  categories,
  onSave,
}: any) {
  const [selected, setSelected] = useState('')

  useEffect(() => {
    if (item) setSelected(item.category_id ?? '')
  }, [item])

  function handleSubmit(e: any) {
    e.preventDefault()
    onSave(item.id, selected)
    onClose()
  }

  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} title="Editar categoria">
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full border rounded p-2 bg-white"
        >
          <option value="">Selecione...</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ${c.name}` : c.name}
            </option>
          ))}
        </select>

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
