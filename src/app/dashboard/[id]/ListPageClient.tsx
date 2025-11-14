'use client'
import { useEffect, useState, useMemo } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useSearchParams, useRouter } from 'next/navigation'
import Items from './Items'

import NewItemModal from './components/NewItemModal'
import EditCategoryModal from './components/EditCategoryModal'
import EditPaymentModal from './components/EditPaymentModal'
import FinalizeModal from './components/FinalizeModal'
import CategoryChart from './components/CategoryChart'
import PaymentMethodChart from './components/PaymentMethodChart'

import { usePlan } from '../../../hooks/usePlans'
  

import Link from 'next/link'
import Summary from './Summary'
import BudgetEditor from './BudgetEditor'
import { ShareBox } from './ShareBox'

export default function ListPageClient({ user, list, listId, budgetCents }: any) {
  const supabase = createClientBrowser()
  const router = useRouter()
  const sp = useSearchParams()

  const monthParam = sp.get('month') ?? currentMonthYYYYMM()

  const [items, setItems] = useState<any[]>([])
  const [methods, setMethods] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month')

  // States modais
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editPaymentOpen, setEditPaymentOpen] = useState(false)

  const [itemToEditCategory, setItemToEditCategory] = useState(null)
  const [itemToEditPayment, setItemToEditPayment] = useState(null)

  const { plan, limits, loading: planLoading, error: planError } = usePlan()

  const hasSelected = useMemo(
  () => items.some(i => i.status === 'selected'),
  [items]
)

  const pingSummary = () =>
    window.dispatchEvent(new CustomEvent('items-changed', { detail: listId }))

  async function loadItems() {
    const { data } = await supabase
      .from('items')
      .select(`
        id, title, url, price_cents, status, bought_at,
        payment_method_id, installments,
        payment_methods ( name ),
        category_id,
        category:categories ( name )
      `)
      .eq('list_id', listId)
      .order('created_at', { ascending: false })

    if (data) {
      const normalized = data.map((i: any) => ({
        ...i,
        payment_methods: Array.isArray(i.payment_methods)
          ? i.payment_methods
          : i.payment_methods
          ? [i.payment_methods]
          : [],
      }))
      setItems(normalized)
    }
  }

  async function loadMethods() {
    const { data } = await supabase
      .from('payment_methods')
      .select('id,name')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })

    if (data) setMethods(data)
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('id,name,icon')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })

    if (data) setCategories(data)
  }

  useEffect(() => {
    loadItems()
    loadMethods()
    loadCategories()
  }, [listId])

  // === FILTRAGEM POR MÊS ===

  function virtualizedItems() {
    const virtual: any[] = []
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

    return [
      ...items.filter(i => !i.installments || i.installments <= 1),
      ...virtual
    ]
  }

  function currentMonthYYYYMM() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const y = parseInt(monthParam.slice(0, 4), 10)
  const m = parseInt(monthParam.slice(5, 7), 10)
  const monthStart = Date.UTC(y, m - 1, 1)
  const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)

  // === 🚨 CORREÇÃO DO BUG DO ITEM SUMIR ===
  const filteredItems = useMemo(() => {
    const all = virtualizedItems()

    if (viewMode === 'all') return all

    return all.filter(i => {
      if (i.status === 'pending') return true  // aparece sempre
      if (i.status === 'selected') return true // aparece sempre

      if (i.status === 'bought') {
        const t = new Date(i.bought_at!).getTime()
        return t >= monthStart && t < monthEnd
      }

      return false
    })
  }, [items, monthParam, viewMode])

  // CRUD

  async function addItem(data: any) {
    const { error } = await supabase.from('items').insert({
      list_id: listId,
      ...data,
    })
    if (!error) {
      loadItems()
      pingSummary()
    }
  }

  async function toggleSelect(item: any) {
    const next = item.status === 'selected' ? 'pending' : 'selected'
    await supabase.from('items').update({ status: next }).eq('id', item.id)
    loadItems()
    pingSummary()
  }

  async function deleteItem(id: string) {
    await supabase.from('items').delete().eq('id', id)
    loadItems()
    pingSummary()
  }

  async function undo(item: any) {
    await supabase
      .from('items')
      .update({
        status: 'pending',
        bought_at: null,
        payment_method_id: null,
      })
      .eq('id', item.id)

    loadItems()
    pingSummary()
  }

  async function updateCategory(itemId: string, categoryId: string) {
    await supabase
      .from('items')
      .update({ category_id: categoryId })
      .eq('id', itemId)

    loadItems()
    pingSummary()
  }

  async function finalizeSelected(paymentId: string, installments: number) {
    const selected = items.filter(i => i.status === 'selected')
    if (!selected.length) return

    const now = new Date().toISOString()

    await supabase
      .from('items')
      .update({
        status: 'bought',
        bought_at: now,
        payment_method_id: paymentId || null,
        installments,
      })
      .in('id', selected.map(i => i.id))

    loadItems()
    pingSummary()
  }

  // === UI ===
  return (
    <main className="w-full mx-auto space-y-4 flex">
      <aside className="w-2/8 space-y-4 bg-five-gray-light p-6 h-dvh sticky overflow-scroll pr-8 mb-0">
        <Link href="/dashboard" className="underline">← Voltar</Link>
        <h1 className="text-xl font-semibold">{list.name}</h1>

        <button
          onClick={() => setNewItemOpen(true)}
          className="px-3 py-3 bg-five-green-medium text-black rounded-full w-full"
        >
          Adicionar novo item
        </button>

        
          <button
              onClick={() => setEditPaymentOpen(true)}
              className={
                `px-3 py-3 rounded-full w-full transition-all duration-200
                ${hasSelected 
                    ? 'bg-five-green-dark text-white' 
                    : 'bg-five-gray-medium text-five-gray-dark cursor-not-allowed'
                }`
              }
            >
              {hasSelected ? 'Finalizar selecionados': 'Selecione os itens que deseja finalizar'}
            </button>

        

        <p className="flex justify-between text-sm">
          {/* <span>Orçamento: R$ {(budgetCents / 100).toFixed(2)}</span> */}
          
        </p>

        <Summary listId={listId} budgetCents={budgetCents} listName={list.name} />

        <p className="text-sm text-gray-500">
          Criado por{' '}
          {list.owner_email
            ? user?.email === list.owner_email
              ? 'você'
              : list.owner_email
            : user?.id === list.owner_id
              ? 'você'
              : 'desconhecido'}
        </p>

        <ShareBox listId={listId} initialEmails={list.shared_emails ?? []} />

        {planLoading ? 
            'Carregando limites do seu plano...'
          : 
            <div className="relative">
              <div className={
                plan !== 'premium'
                  ? 'pointer-events-none blur-sm'
                  : ''
                }>
                <CategoryChart
                  items={items}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  monthParam={monthParam}
                />
        
                <PaymentMethodChart
                  items={items}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  monthParam={monthParam}
                />
              </div>

              {plan !== 'premium' && (
                  <div className="absolute inset-0 flex items-center justify-center flex-col p-10 text-center gap-4 bg-white/40 backdrop-blur-sm rounded-xl">
                    Quer dados detalhados sobre seus gastos? 
                    <button
                      onClick={() => router.push('/config/plan')}
                      className="px-4 py-2 bg-black text-white rounded-full"
                    >
                     Clique aqui e atualize seu plano
                    </button>
                  </div>
                )
              }
            </div>
          
          }

        {/* gráficos */}
      </aside>

      <section className="w-6/8">
        <Items
          items={filteredItems}
          onAdd={() => setNewItemOpen(true)}
          onToggleSelect={toggleSelect}
          onDelete={deleteItem}
          onUndo={undo}
          onEditCategory={(item) => {
            setItemToEditCategory(item)
            setCategoryModalOpen(true)
          }}
          onEditPayment={(item) => {
            setItemToEditPayment(item)
            setPaymentModalOpen(true)
          }}
        />
      </section>

      {/* MODAIS */}
      <NewItemModal
        open={newItemOpen}
        onClose={() => setNewItemOpen(false)}
        categories={categories}
        onConfirm={addItem}
      />

      <EditCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        item={itemToEditCategory}
        categories={categories}
        onSave={updateCategory}
      />

      <EditPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        methods={methods}
        item={itemToEditPayment}
        onSave={(paymentId, installments) =>
          finalizeSelected(paymentId, installments)
        }
      />

      <FinalizeModal
        open={editPaymentOpen}
        onClose={() => setEditPaymentOpen(false)}
        methods={methods}
        onConfirm={finalizeSelected}
      />
    </main>
  )
}

function currentMonthYYYYMM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
