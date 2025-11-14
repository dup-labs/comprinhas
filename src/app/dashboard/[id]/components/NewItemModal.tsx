'use client'
import Modal from '@/app/components/Modal'
import { useState } from 'react'

export default function NewItemModal({ open, onClose, categories, onConfirm }: any) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [installments, setInstallments] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')

  const toCents = (input: string): number | null => {
    if (!input) return null
    const cleaned = input.replace(/[^\d.,-]/g, '').replace(/\s+/g, '')
    const decimal = cleaned.includes(',') && !cleaned.includes('.') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
    const n = parseFloat(decimal)
    return Number.isNaN(n) ? null : Math.round(n * 100)
  }

  function handleSubmit(e: any) {
    e.preventDefault()
    const cents = toCents(price)
    if (cents === null) return alert('Preço inválido.')

    onConfirm({
      title,
      url: url || null,
      price_cents: cents,
      installments,
      status: 'pending',
      category_id: selectedCategory || null,
    })

    // reset
    setTitle('')
    setPrice('')
    setUrl('')
    setInstallments(1)
    setSelectedCategory('')

    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Adicionar item">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Item"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="flex gap-2">
          <input
            className="w-32 border rounded p-2"
            placeholder="Preço"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />

          <input
            className="flex-1 border rounded p-2"
            placeholder="Link (opcional)"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full rounded border p-2 bg-white"
        >
          <option value="">Selecione categoria...</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ${c.name}` : c.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded">
            Cancelar
          </button>
          <button type="submit" className="px-3 py-2 bg-black text-white rounded">
            Adicionar
          </button>
        </div>
      </form>
    </Modal>
  )
}
