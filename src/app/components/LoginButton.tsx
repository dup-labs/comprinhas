'use client'

import { createClientBrowser } from '@/lib/supabase-browser'
import Button from './Button' // seu botão estilizado (client)

export default function LoginButton() {
  const supabase = createClientBrowser()

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return <Button onClick={signIn} text="Entrar com Google" />
}