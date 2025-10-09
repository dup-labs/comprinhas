'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClientBrowser } from '@/lib/supabase-browser'
import ListItem from '../components/ListItem'
import { useDisclosure } from '@/hooks/useDisclosure'
import Modal from '../components/Modal'
import { usePlan } from '../../hooks/usePlans'

type List = { id: string; name: string; monthly_budget_cents: number; created_at: string }

export default function Lists() {
  const newList = useDisclosure(false)
  const supabase = createClientBrowser()
  const [lists, setLists] = useState<List[]>([])
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  // plano do usuário
  const { plan, limits, loading: planLoading, error: planError, reload: reloadPlan } = usePlan()

  async function load() {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setLists((data ?? []) as List[])
  }

  useEffect(() => {
    load()
  }, [])

  // soma todos os budgets atuais do user em cents
  const currentTotalBudgetCents = lists.reduce((acc, l) => acc + (l.monthly_budget_cents || 0), 0)

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()

    // parse do valor inserido
    const cents = Math.round(Number((budget || '0').replace(',', '.')) * 100)

    // checagem 1: limite de número de listas
    if (plan && limits?.maxLists && lists.length >= limits.maxLists) {
      alert('Limite de listas atingido no seu plano. Faça upgrade para o plano Basic ou Premium.')
      return
    }

    // checagem 2: limite de orçamento total (soma)
    if (plan && limits?.maxBudgetCents !== null && typeof limits?.maxBudgetCents !== 'undefined') {
      const projectedTotal = currentTotalBudgetCents + (cents || 0)
      if (projectedTotal > (limits.maxBudgetCents as number)) {
        const formattedLimit = `R$ ${(limits.maxBudgetCents! / 100).toFixed(2)}`
        alert(
          `Limite total de ${formattedLimit} atingido no plano ${plan}. ` +
            `Orçamento atual: R$ ${(currentTotalBudgetCents / 100).toFixed(2)}. ` +
            `Tente um valor menor ou faça upgrade para Basic/Premium.`
        )
        return
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return alert('Faça login.')

    const { error } = await supabase.from('lists').insert({
      owner_id: user.id,
      owner_email: user.email,
      name: name.trim(),
      monthly_budget_cents: cents,
    })
    if (error) return alert(error.message)
    newList.closeModal()
    await load()
    // recarrega possivelmente o plano (se quiser)
    reloadPlan()
  }

  async function onRename(id: string) {
    const current = lists.find((l) => l.id === id)
    const newName = prompt('Novo nome:', current?.name ?? '')
    if (!newName) return
    const { error } = await supabase.from('lists').update({ name: newName }).eq('id', id)
    if (error) return alert(error.message)
    load()
  }

  async function onDelete(id: string) {
    if (!confirm('Apagar esta lista? Itens irão junto.')) return
    const { error } = await supabase.from('lists').delete().eq('id', id)
    if (error) return alert(error.message)
    await load()
    reloadPlan()
  }

  const disableNewList =
    planLoading || (limits?.maxLists && lists.length >= limits.maxLists)

  return (
    <section className="space-y-6">
      {/* listagem */}
      <ul className="flex flex-wrap w-full gap-4 mt-16 p-0 md:p-16">
        <button
          onClick={() => {
            if (disableNewList) {
              alert(
                planLoading
                  ? 'Carregando informações do seu plano...'
                  : 'Limite de listas atingido. Faça upgrade para o plano Basic ou Premium.'
              )
              return
            }
            newList.openModal()
          }}
          disabled={!!disableNewList}
          className={`flex justify-center min-h-30 gap-3 p-5 pt-6 pb-14 -mt-10 md:-mt-0 bg-white rounded-4xl w-full max-w-full md:max-w-48 md:min-w-92 shadow-[0_-10px_20px_-10px_rgb(0_0_0/.25)] ${
            disableNewList ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          Nova lista
        </button>

        {lists.map((l, i) => (
          <ListItem
            listLength={lists.length}
            index={i}
            key={l.id}
            item={l}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}

        {lists.length === 0 && <li className="text-gray-600">Sem listas ainda. Crie a primeira 👆</li>}
      </ul>

      {/* modal: nova lista */}
      <Modal open={newList.open} onClose={newList.closeModal} title="Nova lista">
        <form onSubmit={onCreate} className="space-y-3">
          <input
            autoFocus
            className="w-full rounded border p-2"
            placeholder="Nome da lista"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded border p-2"
            placeholder="Orçamento (R$)"
            inputMode="decimal"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
          <div className="text-xs text-gray-600">
            Total atual de orçamentos: <b>R$ {(currentTotalBudgetCents / 100).toFixed(2)}</b>
            {limits?.maxBudgetCents !== null && limits?.maxBudgetCents !== undefined && (
              <>
                {' '}
                • Limite do seu plano: <b>R$ {(limits.maxBudgetCents! / 100).toFixed(2)}</b>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={newList.closeModal} className="rounded border px-3 py-2">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={disableNewList}
              className={`rounded px-3 py-2 text-white ${
                disableNewList ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
              }`}
            >
              Criar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
