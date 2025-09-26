'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useDisclosure } from '@/hooks/useDisclosure'
import Modal from '@/app/components/Modal'
import ActionButton from '@/app/components/ActionButton'

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

  // --- filtro por mês via URL (?month=YYYY-MM) ---
  const sp = useSearchParams()
  function currentMonthYYYYMM() {
    const now = new Date()
    const yyyy = String(now.getUTCFullYear())
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }
  const monthParam = sp.get('month') ?? currentMonthYYYYMM()
  const y = parseInt(monthParam.slice(0, 4), 10)
  const m = parseInt(monthParam.slice(5, 7), 10) // 1-12
  const monthStart = Date.UTC(y, m - 1, 1)
  const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)

  // toggle: exibir pendentes junto
  const showPending = sp.get('showPending') === 'true'

  // modal "Adicionar item"
  const newItemDialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')

  // helpers
  const fmt = (cents?: number) => `R$ ${((Number(cents ?? 0)) / 100).toFixed(2)}`
  const sameMonth = (dateStr: string) => {
    if (!dateStr) return false
    const t = new Date(dateStr).getTime()
    return t >= monthStart && t < monthEnd
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
      .select('id,title,url,price_cents,status,bought_at,created_at')
      .eq('list_id', listId)
      // Mantém ordem por criação para não "pular" ao mudar status
      .order('created_at', { ascending: false })
    if (!error) setItems((data ?? []) as Item[])
  }
  useEffect(() => { load() }, [listId])

  // ✅ Lista visível reage a showPending e ao mês (sem recarregar do banco)
  const visibleItems = useMemo(() => {
    return items.filter(i => {
      if (i.status === 'bought') return i.bought_at && sameMonth(i.bought_at)
      return showPending
    })
  }, [items, showPending, monthStart, monthEnd])

  // ✅ Totais calculados APENAS com o que está visível
  const selectedCents = useMemo(
    () => visibleItems.filter(i => i.status === 'selected').reduce((s, i) => s + i.price_cents, 0),
    [visibleItems]
  )
  const boughtThisMonth = useMemo(
    () => visibleItems.filter(i => i.status === 'bought').reduce((s, i) => s + i.price_cents, 0),
    [visibleItems]
  )
  const availableThisMonth = budgetCents - boughtThisMonth
  const canFinalize = showPending && selectedCents > 0 && selectedCents <= availableThisMonth

  // modal open/close
  function openNewItem() {
    if (!showPending) return // não permite abrir se pendentes não estão visíveis
    setTitle(''); setPrice(''); setUrl('')
    newItemDialog.current?.showModal()
  }
  function closeNewItem() { newItemDialog.current?.close() }

  // actions
  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!showPending) return // segurança extra
    const cents = toCents(price)
    if (cents === null) return alert('Preço inválido.')
    const { error } = await supabase.from('items').insert({
      list_id: listId,
      title,
      url: url || null,
      price_cents: cents,
      status: 'pending',
    })
    if (error) return alert(error.message)
    closeNewItem()
    await load()
    pingSummary()
  }

  async function toggleSelected(i: Item) {
    if (i.status === 'bought') return
    const next = i.status === 'selected' ? 'pending' : 'selected'
    const { error } = await supabase.from('items').update({ status: next }).eq('id', i.id)
    if (error) return alert(error.message)
    await load()
    pingSummary()
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

  async function undo(i: Item) {
    const { error } = await supabase
      .from('items')
      .update({ status: 'pending', bought_at: null })
      .eq('id', i.id)
    if (error) return alert(error.message)
    await load()
    pingSummary()
  }

  async function del(id: string) {
    if (!confirm('Excluir item?')) return
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) return alert(error.message)
    await load()
    pingSummary()
  }

  return (
    <section className="space-y-4">
      {/* ações */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={openNewItem}
          disabled={!showPending}
          className={`px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full text-nowrap bg-white shadow-gray-200 shadow-md text-xs ${showPending ? '' : 'opacity-50 cursor-not-allowed'}`}
          title={showPending ? 'Adicionar item' : 'Ative "Exibir pendentes" para adicionar'}
        >
          Novo item
        </button>

        <button
          onClick={finalize}
          disabled={!canFinalize}
          className={`px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full text-nowrap text-gray-400 shadow-gray-200 shadow-md text-xs ${canFinalize ? 'bg-green-600 text-white' : 'bg-gray-200 cursor-not-allowed'}`}
          title={canFinalize ? 'Finalizar compra' : 'Selecione itens e/ou ative "Exibir pendentes"'}
        >
          Comprar selecionados
        </button>
      </div>

      {/* totais rápidos (somente do que está visível) */}
      {/* <div className="text-sm  text-gray-700 sticky top-0 bg-white pl-4 pr-4 pt-2 pb-2 z-2 w-[calc(100%+3rem)] -ml-6 text-[11px] shadow-gray-200 shadow-md">
        Comprado no mês: <b>{fmt(boughtThisMonth)}</b> •{' '}
        Disponível: <b>{fmt(availableThisMonth)}</b> •{' '}
        Selecionado: <b>{fmt(selectedCents)}</b>
      </div> */}

      {/* lista filtrada conforme mês e toggle showPending */}
      <ul className="space-y-2">
        {visibleItems.map((i,idx) => (
          <li key={i.id} className={`bg-white mb-4 flex flex-col items-center gap-3 p-4 rounded-4xl pl-4 pr-4  relative shadow-gray-200 shadow-md ${i.status === 'bought' ? `bg-green-100 border-1 border-green-700` : ``}`}>
            <div className='flex w-full items-center gap-4'>
              <input
                className={`appearance-none w-4 h-4 border-2 border-brand-pink-fg rounded-full checked:bg-brand-pink-fg checked:border-brand-pink-fg cursor-pointer transition-all ${i.status === 'bought' ? `opacity-35 bg-green-100 border-green-700` : ``}`}
                  type="checkbox"
                  id={`check-field-${idx}`}
                  disabled={i.status === 'bought'}
                  checked={i.status === 'selected'}
                  onChange={() => toggleSelected(i)}
                  title={i.status === 'bought' ? 'Já comprado' : 'Selecionar para comprar'}
                />
              <label htmlFor={`check-field-${idx}`} className={`cursor-pointer line-clamp-2 leading-tight w-full flex-1 ${i.status === 'bought' ? 'opacity-35 line-through text-gray-500' : ''}`}>
                {i.title || '(sem título)'}
              </label>
              <span className={`${i.status === 'bought' ? 'opacity-35' : ''}`}>{fmt(i.price_cents)}</span>
              {i.url && 
                // <a className="underline" href={i.url} target="_blank" rel="noreferrer">ver</a>
                <ActionButton text="Ver" type="see" href={i.url} newTab />
              }
            </div>
            <div className="flex justify-end gap-5 w-full items-center">
              {i.status === 'bought'
                ? <>
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      comprado
                    </span>
                    {/* <button
                      className="ml-2 text-xs px-2 py-1 rounded border"
                      onClick={() => undo(i)}
                      title="Desfazer compra"
                    >
                      desfazer
                    </button> */}
                    <ActionButton
                      text={`Desfazer compra`}
                      onClick={() => undo(i)}
                      type={`undo`}
                      className={`bg-gray-100`}
                    />
                  </>
                // : <button className="text-sm px-2 py-1 border rounded" onClick={() => del(i.id)}>Excluir</button>
              : <ActionButton
                  text={`Remover`}
                  onClick={() => del(i.id)}
                  type={`remove`}
                  className={`bg-red-100`}
                />
              }
            </div>
          </li>
        ))}
        {visibleItems.length === 0 && <li className="text-gray-600">Nada para exibir.</li>}
      </ul>

      {/* modal: novo item (bloqueado quando showPending=false) */}
      <Modal open={newItem.open} onClose={newItem.closeModal} title="Adicionar item">
        <form onSubmit={addItem} className="space-y-3" key={newItem.open ? 'open' : 'closed'}>
          <input
            autoFocus
            className="w-full border rounded p-2"
            placeholder="Item"
            value={title}
            onChange={e=>setTitle(e.target.value)}
            required
            disabled={!showPending}
          />
          <div className="flex gap-2">
            <input
              className="w-40 border rounded p-2"
              placeholder="Preço (ex: 49,90)"
              inputMode="decimal"
              value={price}
              onChange={e=>setPrice(e.target.value)}
              required
              disabled={!showPending}
            />
            <input
              className="flex-1 border rounded p-2"
              placeholder="Link (opcional)"
              value={url}
              onChange={e=>setUrl(e.target.value)}
              disabled={!showPending}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={newItem.closeModal} className="px-3 py-2 rounded border">Cancelar</button>
            <button type="submit" className="px-3 py-2 rounded bg-black text-white" disabled={!showPending}>
              Adicionar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
