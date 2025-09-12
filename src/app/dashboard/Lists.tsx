'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClientBrowser } from '@/lib/supabase-browser'
import ListItem from '../components/ListItem'
import { useDisclosure } from '@/hooks/useDisclosure'
import Modal from '../components/Modal'


type List = { id: string; name: string; monthly_budget_cents: number; created_at: string }

export default function Lists() {
  const newList = useDisclosure(false)
  const supabase = createClientBrowser()
  const [lists, setLists] = useState<List[]>([])

  // modal "Nova lista"
  const newListDialog = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  async function load() {
    const { data, error } = await supabase.from('lists').select('*').order('created_at', { ascending: false })
    if (!error) setLists((data ?? []) as List[])
  }
  useEffect(() => { load() }, [])

  function openNewList() {
    setName(''); setBudget('')
    newListDialog.current?.showModal()
  }
  function closeNewList() { newListDialog.current?.close() }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    const cents = Math.round(Number((budget || '0').replace(',', '.')) * 100)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Faça login.')
    const { error } = await supabase.from('lists').insert({
      owner_id: user.id, name: name.trim(), monthly_budget_cents: cents
    })
    if (error) return alert(error.message)
    closeNewList()
    await load()
  }

  async function onRename(id: string) {
    const current = lists.find(l => l.id === id)
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
    load()
  }

  return (
    <section className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-medium">Minhas listas</h1>
        <button onClick={newList.openModal} className="px-3 py-2 rounded bg-black text-white">
          Nova lista
        </button>
      </div>

      {/* listagem */}
      <ul className="flex flex-wrap w-full gap-4 mt-16 p-0 md:p-16">
        {lists.map((l,i) => (
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

      {/* modal: nova lista (sem form aninhado) */}
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
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={newList.closeModal} className="rounded border px-3 py-2">
              Cancelar
            </button>
            <button type="submit" className="rounded bg-black px-3 py-2 text-white">
              Criar
            </button>
          </div>
        </form>
      </Modal>
      
    </section>
  )
}