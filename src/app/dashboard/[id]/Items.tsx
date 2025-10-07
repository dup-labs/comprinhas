'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  payment_method_id?: string | null
  payment_methods?: { name: string | null }[] | null
  installments?: number
}

type PaymentMethod = {
  id: string
  name: string
}

export default function Items({
  listId,
  budgetCents,
}: {
  listId: string
  budgetCents: number
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const supabase = createClientBrowser()

  const [items, setItems] = useState<Item[]>([])
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedPayment, setSelectedPayment] = useState<string>('')
  const [installments, setInstallments] = useState<number>(1)
  const finalizeModal = useDisclosure(false)
  const editPaymentModal = useDisclosure(false)
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null)
  const [editSelectedPayment, setEditSelectedPayment] = useState<string>('')

  // modal "novo item"
  const newItem = useDisclosure(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [url, setUrl] = useState('')

  // --- mês via URL (?month=YYYY-MM) ---
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

  const fmt = (cents?: number) => `R$ ${((Number(cents ?? 0)) / 100).toFixed(2)}`
  const pingSummary = () =>
    window.dispatchEvent(new CustomEvent('items-changed', { detail: listId }))

  async function load() {
    const { data, error } = await supabase
      .from('items')
      .select(
        'id,title,url,price_cents,status,bought_at,payment_method_id,installments,payment_methods(name)'
      )
      .eq('list_id', listId)
      .order('created_at', { ascending: false })
    if (!error) setItems((data ?? []) as Item[])
  }

  async function loadMethods() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id,name')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })
    if (!error) setMethods((data ?? []) as PaymentMethod[])
  }

  useEffect(() => {
    load()
    loadMethods()
  }, [listId])

  // lista visível
  const visibleItems = useMemo(() => {
  const expanded: Item[] = []

  items.forEach((i) => {
    if (i.status === 'bought' && i.bought_at) {
      const boughtDate = new Date(i.bought_at)
      const baseTime = Date.UTC(
        boughtDate.getUTCFullYear(),
        boughtDate.getUTCMonth(),
        1
      )

      const n = i.installments ?? 1
      const installmentValue = Math.round(i.price_cents / n)

      // gera parcelas “fantasmas” pros próximos meses
      for (let k = 0; k < n; k++) {
        const installmentDate = new Date(baseTime)
        installmentDate.setUTCMonth(installmentDate.getUTCMonth() + k)

        expanded.push({
          ...i,
          id: `${i.id}-p${k + 1}`,
          bought_at: installmentDate.toISOString(),
          price_cents: installmentValue,
        })
      }
    } else {
      expanded.push(i)
    }
  })

  return expanded.filter((i) => {
    if (i.status === 'bought') {
      const t = new Date(i.bought_at!).getTime()
      return t >= monthStart && t < monthEnd
    }
    return showPending
  })
}, [items, showPending, monthStart, monthEnd])


  const selectedCents = useMemo(
    () =>
      visibleItems
        .filter((i) => i.status === 'selected')
        .reduce((s, i) => s + i.price_cents, 0),
    [visibleItems]
  )

  const boughtThisMonth = useMemo(
    () =>
      visibleItems
        .filter((i) => i.status === 'bought')
        .reduce((s, i) => s + i.price_cents, 0),
    [visibleItems]
  )

  const availableThisMonth = budgetCents - boughtThisMonth
  const canFinalize = showPending && selectedCents > 0

  function ensureShowPendingOn() {
    const params = new URLSearchParams(sp)
    if (params.get('showPending') !== 'true') {
      params.set('showPending', 'true')
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  function openNewItem() {
    ensureShowPendingOn()
    setTitle('')
    setPrice('')
    setUrl('')
    newItem.openModal()
  }
  function closeNewItem() {
    newItem.closeModal()
  }

  const toCents = (input: string): number | null => {
    if (!input) return null
    const cleaned = input
      .toString()
      .replace(/[^\d.,-]/g, '')
      .replace(/\s+/g, '')
    const decimal =
      cleaned.includes(',') && !cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned
    const n = parseFloat(decimal)
    if (Number.isNaN(n)) return null
    return Math.round(n * 100)
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
      status: 'pending',
    })
    if (error) return alert(error.message)
    ensureShowPendingOn()
    closeNewItem()
    await load()
    pingSummary()
  }

  async function toggleSelected(i: Item) {
    if (i.status === 'bought') return
    const next = i.status === 'selected' ? 'pending' : 'selected'
    const { error } = await supabase
      .from('items')
      .update({ status: next })
      .eq('id', i.id)
    if (error) return alert(error.message)
    await load()
    pingSummary()
  }

  async function undo(i: Item) {
    const cleanId = i.id.split('-p')[0] // remove o sufixo de parcela

    const { error } = await supabase
      .from('items')
      .update({
        status: 'pending',
        bought_at: null,
        payment_method_id: null,
        installments: 1,
      })
      .eq('id', cleanId)

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

  async function updatePaymentMethod(e: React.FormEvent) {
    e.preventDefault()
    if (!itemToEdit || !editSelectedPayment) return

    const { error } = await supabase
      .from('items')
      .update({ payment_method_id: editSelectedPayment })
      .eq('id', itemToEdit.id)

    if (error) return alert(error.message)

    editPaymentModal.closeModal()
    setItemToEdit(null)
    await load()
    pingSummary()
  }

  function openFinalizeModal() {
    if (!canFinalize) return
    setSelectedPayment('')
    setInstallments(1)
    finalizeModal.openModal()
  }

  return (
    <section className="space-y-4">
      {/* ações */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={openNewItem}
          className="px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full bg-white shadow-gray-200 shadow-md text-xs cursor-pointer"
        >
          Novo item
        </button>

        <button
          onClick={openFinalizeModal}
          disabled={!canFinalize}
          className={`px-3 py-3 rounded-br-2xl rounded-bl-2xl w-full text-xs ${
            canFinalize
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Comprar selecionados
        </button>
      </div>

      {/* lista */}
      <ul className="space-y-2">
        {visibleItems.map((i, idx) => (
          <li
            key={i.id}
            className={`bg-white mb-4 flex flex-col items-center gap-3 p-4 rounded-4xl shadow-gray-200 shadow-md ${
              i.status === 'bought'
                ? 'bg-green-100 border border-green-700'
                : ''
            }`}
          >
            <div className="flex w-full items-center gap-4">
              <input
                className={`appearance-none w-4 h-4 border-2 border-brand-pink-fg rounded-full checked:bg-brand-pink-fg cursor-pointer transition-all ${
                  i.status === 'bought'
                    ? 'opacity-35 bg-green-100 border-green-700'
                    : ''
                }`}
                type="checkbox"
                id={`check-${idx}`}
                disabled={i.status === 'bought'}
                checked={i.status === 'selected'}
                onChange={() => toggleSelected(i)}
              />
              <label
                htmlFor={`check-${idx}`}
                className={`cursor-pointer line-clamp-2 leading-tight flex-1 ${
                  i.status === 'bought'
                    ? 'opacity-35 line-through text-gray-500'
                    : ''
                }`}
              >
                {i.title || '(sem título)'}
              </label>
              <span className={`${i.status === 'bought' ? 'opacity-35' : ''}`}>
                {fmt(i.price_cents)}
                {i.installments && i.installments > 1 && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({i.id.split('-p')[1]}/{i.installments}) — total {fmt(i.price_cents * i.installments)}
                  </span>
                )}
              </span>
              {i.url && (
                <ActionButton text="Ver" type="see" href={i.url} newTab />
              )}
            </div>

            <div className="flex justify-end gap-5 w-full items-center">
              {i.status === 'bought' ? (
                <>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">
                      comprado
                    </span>
                    {i.payment_methods?.[0]?.name && (
                      
                      <span className="text-xs text-gray-600">
                        via {i.payment_methods?.[0]?.name ?? '—'}
                        {i.installments && i.installments > 1
                          ? ` (${i.installments}x)`
                          : ''}
                      </span>
                    )}
                  </div>
                  <ActionButton
                    text="Desfazer"
                    onClick={() => undo(i)}
                    type="undo"
                    className="bg-gray-100"
                  />
                </>
              ) : (
                <ActionButton
                  text="Remover"
                  onClick={() => del(i.id)}
                  type="remove"
                  className="bg-red-100"
                />
              )}
            </div>
          </li>
        ))}
        {visibleItems.length === 0 && (
          <li className="text-gray-600">Nada para exibir.</li>
        )}
      </ul>

      {/* modal: novo item */}
      <Modal
        open={newItem.open}
        onClose={newItem.closeModal}
        title="Adicionar item"
      >
        <form onSubmit={addItem} className="space-y-3">
          <input
            autoFocus
            className="w-full border rounded p-2"
            placeholder="Item"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <input
              className="w-40 border rounded p-2"
              placeholder="Preço (ex: 49,90)"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <input
              className="flex-1 border rounded p-2"
              placeholder="Link (opcional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeNewItem}
              className="px-3 py-2 rounded border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded bg-black text-white"
            >
              Adicionar
            </button>
          </div>
        </form>
      </Modal>

      {/* modal: finalizar compra */}
      <Modal
        open={finalizeModal.open}
        onClose={finalizeModal.closeModal}
        title="Finalizar compra"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            if (!selectedPayment)
              return alert('Selecione a forma de pagamento.')

            const selectedName =
              methods.find((m) => m.id === selectedPayment)?.name || ''
            const showInstallments = /crédito/i.test(selectedName)

            const installmentsToSave =
              showInstallments && installments > 0 ? installments : 1

            const { error } = await supabase
              .from('items')
              .update({
                status: 'bought',
                bought_at: new Date().toISOString(),
                payment_method_id: selectedPayment,
                installments: installmentsToSave,
              })
              .eq('list_id', listId)
              .eq('status', 'selected')

            if (error) return alert(error.message)

            finalizeModal.closeModal()
            await load()
            pingSummary()
          }}
          className="space-y-3"
        >
          <label className="block">
            <span className="text-sm">Forma de pagamento</span>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="mt-1 w-full rounded border p-2 bg-white"
              required
            >
              <option value="">Selecione...</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {/* campo parcelas — só aparece pra cartões */}
          {(() => {
            const selectedName =
              methods.find((m) => m.id === selectedPayment)?.name || ''
            const showInstallments = /crédito/i.test(selectedName)
            return (
              showInstallments && (
                <label className="block">
                  <span className="text-sm">Quantidade de parcelas</span>
                  <select
                    value={installments}
                    onChange={(e) =>
                      setInstallments(parseInt(e.target.value))
                    }
                    className="mt-1 w-full rounded border p-2 bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x
                      </option>
                    ))}
                  </select>
                </label>
              )
            )
          })()}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={finalizeModal.closeModal}
              className="border px-3 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-3 py-2 rounded"
            >
              Confirmar compra
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
