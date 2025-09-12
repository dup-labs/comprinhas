'use client'
import { redirect } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase-browser'
import Button from './components/Button'

export default async function Home() {
  

  // se já logado, manda direto para as listas
  
  const supabase = createClientBrowser()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }
  return (
    <div className='flex items-center justify-center h-full flex-col gap-10'>
      <img src="/logo.svg" alt="Comprinhas" className="h-24 w-auto" />
      <Button onClick={signIn} text={`Entrar com Google`} />
      
    </div>
  )
}