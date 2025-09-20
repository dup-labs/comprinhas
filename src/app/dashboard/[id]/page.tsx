// import { createClientServer } from '@/lib/supabase-server'
import Link from 'next/link'
import Items from './Items'
import Summary from './Summary'
import BudgetEditor from './BudgetEditor' // + ADD
import { ShareBox } from './ShareBox'

import { createClientServerRSC } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0


export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params; 

  const supabase = await createClientServerRSC()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <main className="p-6">Sem login. <a href="/">Voltar</a></main>

  const { data: list } = await supabase.from('lists').select('*').eq('id', id).single()

  if (!list) return <main className="p-6">Lista não encontrada. <Link href="/dashboard">Voltar</Link></main>

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <Link href="/dashboard" className="underline">← Voltar</Link>
      <h1 className="text-xl font-semibold">{list.name}</h1>
      <p className='flex justify-between'>
        <span>Orçamento: R$ {(list.monthly_budget_cents/100).toFixed(2)}</span>
        <BudgetEditor
          listId={id}
          initialBudgetCents={list.monthly_budget_cents}
        />
      </p>
      <Summary listId={id} budgetCents={list.monthly_budget_cents} />
      <h2>Itens</h2>
      <Items listId={id} budgetCents={list.monthly_budget_cents} /> 
      <p className="text-sm text-gray-500">
        Criado por{' '}
        {list.owner_email
          ? (user?.email === list.owner_email ? 'você' : list.owner_email)
          : (user?.id === list.owner_id ? 'você' : 'desconhecido')}
      </p>

      <ShareBox listId={id} initialEmails={list.shared_emails ?? []} />
      {/* <div className="text-gray-600">Próximo: itens da lista.</div> */}
    </main>
  )
}