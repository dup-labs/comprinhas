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
    <main className="bg-five-green-light w-full p-12 items-center justify-center gap-40 md:bg-[url('/five-bg-login.png')] md:bg-cover md:bg-right-bottom flex h-dvh flex-col md:items-end md:justify-between md:gap-10 md:p-72">
      <img src="/logo-login.svg" alt="Comprinhas" className="h-24 w-auto" />
      <LoginButton />
    </main>
  )
}