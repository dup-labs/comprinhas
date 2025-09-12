'use client'
import { createClientBrowser } from '@/lib/supabase-browser'
import Button from './components/Button'

export default function Home() {
  const supabase = createClientBrowser()
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