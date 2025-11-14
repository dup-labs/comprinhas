// pages.tsx — SERVER COMPONENT
import Link from 'next/link'
import { createClientServerRSC } from '@/lib/supabase-server'
import Header from '@/app/components/Header'
import ListPageClient from './ListPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = params

  const supabase = await createClientServerRSC()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user)
    return (
      <main className="p-6">
        Sem login. <a href="/">Voltar</a>
      </main>
    )

  const { data: list } = await supabase
    .from('lists')
    .select('*')
    .eq('id', id)
    .single()

  if (!list)
    return (
      <main className="p-6">
        Lista não encontrada. <Link href="/dashboard">Voltar</Link>
      </main>
    )

  return (
    <>
      <Header />

      <ListPageClient
        user={user}
        list={list}
        listId={id}
        budgetCents={list.monthly_budget_cents}
      />
    </>
  )
}
