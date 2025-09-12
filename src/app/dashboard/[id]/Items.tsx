'use client'
import { useEffect, useRef, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useDisclosure } from '@/hooks/useDisclosure'
import Modal from '@/app/components/Modal'

type Item = {
  id: string
  title: string
  url: string | null
  price_cents: number
  status: 'pending' | 'selected' | 'bought'
  bought_at: string | null
}

export default function Items({
  listId,
  budgetCents,
}: {
  listId: string
  budgetCents: number
}) {
  const newItem = useDisclosure(false)
  const supabase = createClientBrowser()
  const [items, setItems] = useState<Item[]>([])

  // modal "Adicionar item"
  const newItemDialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')

  // helpers
  const fmt = (cents?: number) => `R$ ${((Number(cents ?? 0)) / 100).toFixed(2)}`
  const sameMonth = (dateStr: string) => {
    const d = new Date(dateStr); const now = new Date()
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
  }
  const toCents = (input: string): number | null => {
    if (!input) return null
    const cleaned = input.toString().replace(/[^\d.,-]/g, '').replace(/\s+/g, '')
    const decimal = cleaned.includes(',') && !cleaned.includes('.') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
    const n = parseFloat(decimal)
    if (Number.isNaN(n)) return null
    return Math.round(n * 100)
  }
  const pingSummary = () => window.dispatchEvent(new CustomEvent('items-changed', { detail: listId }))

  // data
  async function load() {
    const { data, error } = await supabase
      .from('items')
      .select('id,title,url,price_cents,status,bought_at')
      .eq('list_id', listId)
      .order('status', { ascending: true })
      .order('created_at', { ascending: false })
    if (!error) setItems((data ?? []) as Item[])
  }
  useEffect(() => { load() }, [listId])

  // derived (para bloquear botão)
  const selectedCents = items.filter(i => i.status === 'selected').reduce((s, i) => s + i.price_cents, 0)
  const boughtThisMonth = items
    .filter(i => i.status === 'bought' && i.bought_at && sameMonth(i.bought_at))
    .reduce((s, i) => s + i.price_cents, 0)
  const availableThisMonth = budgetCents - boughtThisMonth
  const canFinalize = selectedCents > 0 && selectedCents <= availableThisMonth

  // modal open/close
  function openNewItem() {
    setTitle(''); setPrice(''); setUrl('')
    newItemDialog.current?.showModal()
  }
  function closeNewItem() { newItemDialog.current?.close() }

  // actions
  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    if (!t) return alert('Coloque um nome pro item.')
    const cents = toCents(price)
    if (cents === null) return alert('Preço inválido.')

    const { error } = await supabase.from('items').insert({
      list_id: listId, title: t, url: url.trim() || null, price_cents: cents
    })
    if (error) return alert(error.message)

    closeNewItem()
    await load()
    pingSummary()
  }

  async function del(id: string) {
    if (!confirm('Excluir item?')) return
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (!error) { await load(); pingSummary() }
  }

  async function toggleSelected(i: Item) {
    if (i.status === 'bought') return
    const next = i.status === 'selected' ? 'pending' : 'selected'
    const { error } = await supabase.from('items').update({ status: next }).eq('id', i.id)
    if (!error) { await load(); pingSummary() }
  }

  async function finalize() {
    if (!canFinalize) return
    const { error } = await supabase
      .from('items')
      .update({ status: 'bought', bought_at: new Date().toISOString() })
      .eq('list_id', listId)
      .eq('status', 'selected')
    if (error) return alert(error.message)
    await load()
    pingSummary()
  }

  // UI
  return (
    <section className="space-y-4">
      {/* ações */}
      <div className="flex items-center gap-2">
        <button onClick={newItem.openModal} className="px-3 py-2 rounded border">Adicionar item</button>
        <button
          onClick={finalize}
          disabled={!canFinalize}
          className={`px-3 py-2 rounded text-white ${canFinalize ? 'bg-green-600' : 'bg-gray-400 cursor-not-allowed'}`}
          title={canFinalize ? 'Finalizar compra' : 'Seleção acima do disponível do mês'}
        >
          Marcar selecionados como comprados
        </button>
      </div>

      {/* lista */}
      <ul className="space-y-2">
        {items.map(i => (
          <li key={i.id} className="flex items-center gap-3 p-2 border rounded relative">
            <input
              type="checkbox"
              disabled={i.status === 'bought'}
              checked={i.status === 'selected'}
              onChange={() => toggleSelected(i)}
              title={i.status === 'bought' ? 'Já comprado' : 'Selecionar para comprar'}
            />
            <span className={`flex-1 ${i.status === 'bought' ? 'line-through text-gray-500' : ''}`}>
              {i.title || '(sem título)'}
            </span>
            <span>{fmt(i.price_cents)}</span>
            {i.url && <a className="underline" href={i.url} target="_blank" rel="noreferrer">ver</a>}
            {i.status === 'bought'
              ? <>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">comprado</span>
                  {i.bought_at && (
                    <span className="absolute right-2 bottom-1 text-[10px] text-gray-500">
                      {new Date(i.bought_at).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </>
              : <button className="text-sm px-2 py-1 border rounded" onClick={() => del(i.id)}>Excluir</button>
            }
          </li>
        ))}
        {items.length === 0 && <li className="text-gray-600">Sem itens ainda.</li>}
      </ul>

      {/* modal: novo item (sem form aninhado) */}
      <Modal open={newItem.open} onClose={newItem.closeModal} title="Adicionar item">
        <form onSubmit={addItem} className="space-y-3" key={newItem.open ? 'open' : 'closed'}>
          <input
            autoFocus
            className="w-full border rounded p-2"
            placeholder="Item"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input
              className="w-40 border rounded p-2"
              placeholder="Preço (ex: 49,90)"
              inputMode="decimal"
              value={price}
              onChange={e=>setPrice(e.target.value)}
              required
            />
            <input
              className="flex-1 border rounded p-2"
              placeholder="Link (opcional)"
              value={url}
              onChange={e=>setUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={newItem.closeModal} className="px-3 py-2 rounded border">Cancelar</button>
            <button type="submit" className="px-3 py-2 rounded bg-black text-white">Adicionar</button>
          </div>
        </form>
      </Modal>
    </section>
  )
}