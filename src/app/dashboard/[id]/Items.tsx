'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useDisclosure } from '@/hooks/useDisclosure'
import Modal from '@/app/components/Modal'
import ActionButton from '@/app/components/ActionButton'
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Item = {
  id: string
  title: string
  url: string | null
  price_cents: number
  status: 'pending' | 'selected' | 'bought'
  bought_at: string | null
  payment_method_id?: string | null
  payment_methods?: { name: string | null }[] | null
  installments?: number | null
  category_id?: string | null
  category?: { name: string | null } | null
}

type PaymentMethod = { id: string; name: string }
type Category = { id: string; name: string; icon?: string }

export default function Items({ listId, budgetCents }: { listId: string; budgetCents: number }) {
  const router = useRouter()
  const sp = useSearchParams()
  const supabase = createClientBrowser()

  const [items, setItems] = useState<Item[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month')

  const finalizeModal = useDisclosure(false)
  const newItem = useDisclosure(false)
  const editCategoryModal = useDisclosure(false)
  const paymentModal = useDisclosure(false)
  const editPaymentModal = useDisclosure(false)

  const [itemToEditCategory, setItemToEditCategory] = useState<Item | null>(null)
  const [editSelectedCategory, setEditSelectedCategory] = useState<string>('')

  const [itemToEditPayment, setItemToEditPayment] = useState<Item | null>(null)
  const [editSelectedPayment, setEditSelectedPayment] = useState<string>('')
  const [editInstallments, setEditInstallments] = useState<number>(1)

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')
  const [installments, setInstallments] = useState(1)

  const fmt = (c?: number) => `R$ ${(Number(c ?? 0) / 100).toFixed(2)}`
  const pingSummary = () => window.dispatchEvent(new CustomEvent('items-changed', { detail: listId }))

  function currentMonthYYYYMM() {
    const now = new Date()
    const yyyy = String(now.getUTCFullYear())
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }

  const monthParam = sp.get('month') ?? currentMonthYYYYMM()
  const y = parseInt(monthParam.slice(0, 4), 10)
  const m = parseInt(monthParam.slice(5, 7), 10)
  const monthStart = Date.UTC(y, m - 1, 1)
  const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)
  const showPending = sp.get('showPending') === 'true'

  async function load() {
    const { data, error } = await supabase
      .from('items')
      .select(`
        id,
        title,
        url,
        price_cents,
        status,
        bought_at,
        payment_method_id,
        installments,
        payment_methods ( name ),
        category_id,
        category:categories ( name )
      `)
      .eq('list_id', listId)
      .order('created_at', { ascending: false })
    if (!error && data) setItems(data as Item[])
  }

  async function loadMethods() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id,name')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })
    if (!error && data) setMethods(data)
  }

  async function loadCategories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('categories')
      .select('id,name,icon')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })
    if (!error && data) setCategories(data)
  }

  useEffect(() => {
    load()
    loadMethods()
    loadCategories()
  }, [listId])

  const toCents = (input: string): number | null => {
    if (!input) return null
    const cleaned = input.replace(/[^\d.,-]/g, '').replace(/\s+/g, '')
    const decimal = cleaned.includes(',') && !cleaned.includes('.') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
    const n = parseFloat(decimal)
    return Number.isNaN(n) ? null : Math.round(n * 100)
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const cents = toCents(price)
    if (cents === null) return alert('Preço inválido.')
    const { error } = await supabase.from('items').insert({
      list_id: listId,
      title,
      url: url || null,
      price_cents: cents,
      installments: installments || 1,
      status: 'pending',
      category_id: selectedCategory || null,
    })
    if (error) return alert(error.message)
    newItem.closeModal()
    await load()
    pingSummary()
  }

  async function finalizeSelected() {
    const selected = items.filter(i => i.status === 'selected')
    if (!selected.length) return alert('Nenhum item selecionado.')
    paymentModal.openModal()
  }

  async function confirmPaymentMethod() {
    const selected = items.filter(i => i.status === 'selected')
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('items')
      .update({
        status: 'bought',
        bought_at: now,
        payment_method_id: selectedPayment || null,
        installments,
      })
      .in('id', selected.map(i => i.id))
    if (error) return alert(error.message)
    paymentModal.closeModal()
    await load()
    pingSummary()
  }

  async function updatePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!itemToEditPayment) return
    const { error } = await supabase
      .from('items')
      .update({
        payment_method_id: editSelectedPayment,
        installments: editInstallments,
      })
      .eq('id', itemToEditPayment.id)
    if (error) return alert(error.message)
    editPaymentModal.closeModal()
    await load()
    pingSummary()
  }

  async function undo(i: Item) {
    const { error } = await supabase
      .from('items')
      .update({ status: 'pending', bought_at: null, payment_method_id: null })
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

  async function updateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!itemToEditCategory) return
    const { error } = await supabase
      .from('items')
      .update({ category_id: editSelectedCategory || null })
      .eq('id', itemToEditCategory.id)
    if (error) return alert(error.message)
    editCategoryModal.closeModal()
    setItemToEditCategory(null)
    await load()
    pingSummary()
  }

  function virtualizedItems() {
    const virtual: Item[] = []
    items.forEach(i => {
      if (i.status !== 'bought' || !i.installments || i.installments <= 1 || !i.bought_at) return
      const boughtDate = new Date(i.bought_at)
      for (let n = 1; n <= i.installments; n++) {
        const clone = { ...i }
        const due = new Date(boughtDate)
        due.setMonth(due.getMonth() + (n - 1))
        clone.price_cents = Math.round(i.price_cents / i.installments)
        clone.title = `${i.title} (${n}/${i.installments})`
        clone.bought_at = due.toISOString()
        virtual.push(clone)
      }
    })
    return [...items.filter(i => !i.installments || i.installments <= 1), ...virtual]
  }

  const visibleItems = useMemo(() => {
    const all = virtualizedItems()
    return all.filter(i => {
      if (i.status === 'bought') {
        const t = new Date(i.bought_at!).getTime()
        return t >= monthStart && t < monthEnd
      }
      return showPending
    })
  }, [items, showPending, monthStart, monthEnd])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => newItem.openModal()}
          className="px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full bg-white shadow-gray-200 shadow-md text-xs cursor-pointer"
        >
          Novo item
        </button>
        <button
          onClick={finalizeSelected}
          className="px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full bg-green-600 text-white shadow-md text-xs cursor-pointer"
        >
          Finalizar selecionados
        </button>
      </div>

      <ul className="space-y-2">
        {visibleItems.map((i, idx) => (
          <li
            key={i.id + idx}
            className={`bg-white mb-4 flex flex-col items-center gap-3 p-4 rounded-4xl shadow-gray-200 shadow-md ${
              i.status === 'bought' ? 'bg-green-100 border border-green-700 opacity-50' : ''
            }`}
          >
            <div className="flex w-full items-center gap-4">
              <input
                className={`appearance-none w-4 h-4 border-2 border-brand-pink-fg rounded-full checked:bg-brand-pink-fg cursor-pointer ${
              i.status === 'bought' ? 'bg-green-100 border border-green-700' : ''
            }`}
                type="checkbox"
                checked={i.status === 'selected'}
                onChange={() => {
                  const next = i.status === 'selected' ? 'pending' : 'selected'
                  supabase.from('items').update({ status: next }).eq('id', i.id).then(load)
                }}
              />
              <label className="cursor-pointer line-clamp-2 leading-tight flex-1">
                {i.title || '(sem título)'}
              </label>
              <div className="flex flex-col items-end">
                <span>{fmt(i.price_cents)}</span>
                {i.category?.name && <span className="text-xs text-gray-500">{i.category.name}</span>}
                {i.payment_methods?.name && (
                  <span className="text-xs text-gray-600 italic">
                    via {i.payment_methods.name}
                    {i.installments && i.installments > 1 ? ` • ${i.installments}x` : ''}
                  </span>
                )}
              </div>
              {i.url && <ActionButton text="Ver" type="see" href={i.url} newTab />}
            </div>
            <div className="flex justify-end gap-5 w-full items-center">
              {i.status === 'bought' && (
                <button
                  onClick={() => {
                    setItemToEditPayment(i)
                    setEditSelectedPayment(i.payment_method_id ?? '')
                    setEditInstallments(i.installments ?? 1)
                    editPaymentModal.openModal()
                  }}
                  className="text-xs underline text-gray-500 hover:text-gray-700"
                >
                  Editar pagamento
                </button>
              )}
              <button
                onClick={() => {
                  setItemToEditCategory(i)
                  setEditSelectedCategory(i.category_id ?? '')
                  editCategoryModal.openModal()
                }}
                className="text-xs underline text-gray-500 hover:text-gray-700"
              >
                Editar categoria
              </button>
              {i.status === 'bought' ? (
                <ActionButton text="Desfazer" onClick={() => undo(i)} type="undo" />
              ) : (
                <ActionButton text="Remover" onClick={() => del(i.id)} type="remove" />
              )}
            </div>
          </li>
        ))}
        {visibleItems.length === 0 && <li className="text-gray-600">Nada para exibir.</li>}
      </ul>

      {/* --- MODAIS --- */}
      {/* Novo item */}
      <Modal open={newItem.open} onClose={newItem.closeModal} title="Adicionar item">
        <form onSubmit={addItem} className="space-y-3">
          <input className="w-full border rounded p-2" placeholder="Item" value={title} onChange={e => setTitle(e.target.value)} required />
          <div className="flex gap-2">
            <input className="w-32 border rounded p-2" placeholder="Preço" value={price} onChange={e => setPrice(e.target.value)} required />
            <input className="flex-1 border rounded p-2" placeholder="Link (opcional)" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <input className="w-full border rounded p-2" placeholder="Parcelas (1)" type="number" min={1} value={installments} onChange={e => setInstallments(Number(e.target.value))} />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full rounded border p-2 bg-white">
            <option value="">Selecione categoria...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ${c.name}` : c.name}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={newItem.closeModal} className="px-3 py-2 border rounded">Cancelar</button>
            <button type="submit" className="px-3 py-2 bg-black text-white rounded">Adicionar</button>
          </div>
        </form>
      </Modal>

      {/* Finalizar compra */}
      <Modal open={paymentModal.open} onClose={paymentModal.closeModal} title="Método de pagamento">
  <form onSubmit={e => { e.preventDefault(); confirmPaymentMethod() }} className="space-y-3">
    <select
      value={selectedPayment}
      onChange={e => setSelectedPayment(e.target.value)}
      className="w-full rounded border p-2 bg-white"
    >
      <option value="">Selecione...</option>
      {methods.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>

    {/* só mostra se for crédito */}
    {methods.find(m => m.id === selectedPayment)?.name?.toLowerCase().includes('crédito') && (
      <select
        value={installments}
        onChange={e => setInstallments(Number(e.target.value))}
        className="w-full rounded border p-2 bg-white"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n}x</option>
        ))}
      </select>
    )}

    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={paymentModal.closeModal} className="border px-3 py-2 rounded">Cancelar</button>
      <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded">Confirmar</button>
    </div>
  </form>
</Modal>


      {/* Editar pagamento */}
      <Modal open={editPaymentModal.open} onClose={editPaymentModal.closeModal} title="Editar pagamento">
  <form onSubmit={updatePayment} className="space-y-3">
    <select
      value={editSelectedPayment}
      onChange={e => setEditSelectedPayment(e.target.value)}
      className="w-full border rounded p-2 bg-white"
    >
      <option value="">Selecione método...</option>
      {methods.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>

    {/* só mostra se for crédito */}
    {methods.find(m => m.id === editSelectedPayment)?.name?.toLowerCase().includes('crédito') && (
      <select
        value={editInstallments}
        onChange={e => setEditInstallments(Number(e.target.value))}
        className="w-full border rounded p-2 bg-white"
      >
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
          <option key={n} value={n}>{n}x</option>
        ))}
      </select>
    )}

    <div className="flex justify-end gap-2">
      <button type="button" onClick={editPaymentModal.closeModal} className="border px-3 py-2 rounded">Cancelar</button>
      <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded">Salvar</button>
    </div>
  </form>
</Modal>


      {/* Editar categoria */}
      <Modal open={editCategoryModal.open} onClose={editCategoryModal.closeModal} title="Editar categoria">
        <form onSubmit={updateCategory} className="space-y-3">
          <select value={editSelectedCategory} onChange={e => setEditSelectedCategory(e.target.value)} className="w-full border rounded p-2 bg-white">
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ${c.name}` : c.name}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={editCategoryModal.closeModal} className="border px-3 py-2 rounded">Cancelar</button>
            <button type="submit" className="bg-green-600 text-white px-3 py-2 rounded">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Gráfico */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-gray-200 shadow-md p-4 mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Distribuição por categoria</h3>
            <select
              value={viewMode}
              onChange={e => setViewMode(e.target.value as 'month' | 'all')}
              className="text-xs border rounded p-1"
            >
              <option value="month">Mês atual</option>
              <option value="all">Geral</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={Object.entries(
                  virtualizedItems()
                    .filter(i => i.status === 'bought')
                    .filter(i => {
                      if (viewMode === 'all') return true
                      const t = new Date(i.bought_at!).getTime()
                      return t >= monthStart && t < monthEnd
                    })
                    .reduce((acc: Record<string, number>, i) => {
                      const cat = i.category?.name || 'Sem categoria'
                      acc[cat] = (acc[cat] || 0) + i.price_cents / 100
                      return acc
                    }, {})
                ).map(([name, value]) => ({ name, value: Number(value) }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label={({ name, value }: any) => `${name} (${value.toFixed(2)} R$)`}
              />
              <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} contentStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
