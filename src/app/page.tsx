import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase-server'
import LoginButton from './components/LoginButton' // botão client que chama o OAuth

export default async function Home() {
  // cookies() agora é assíncrono dentro do helper → aguarde aqui
  const supabase = await createClientServer()
  const { data: { user } } = await supabase.auth.getUser()

  // já logado? manda pro dashboard
  if (user) redirect('/dashboard')

  // não logado → mostra logo + botão
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-10 p-6">
      <img src="/logo.svg" alt="Comprinhas" className="h-24 w-auto" />
      <LoginButton />
    </main>
  )
}