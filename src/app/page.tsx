import { redirect } from 'next/navigation'
// import { createClientServer } from '@/lib/supabase-server'
import LoginButton from './components/LoginButton' // botão client que chama o OAuth

import { createClientServerRSC } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  // cookies() agora é assíncrono dentro do helper → aguarde aqui
  const supabase = await createClientServerRSC()
  const { data: { user } } = await supabase.auth.getUser()

  // já logado? manda pro dashboard
  if (user) redirect('/dashboard')

  // não logado → mostra logo + botão
  return (
    <main className="bg-[url('/five-bg-login.png')] bg-cover bg-right-bottom flex h-dvh flex-col items-end justify-between gap-10 p-72">
      <img src="/logo-login.svg" alt="Comprinhas" className="h-24 w-auto" />
      <LoginButton />
    </main>
  )
}