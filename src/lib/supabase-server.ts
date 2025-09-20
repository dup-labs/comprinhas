// src/lib/supabase-server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ➜ Use em Server Components (páginas / layouts / loaders)
//    NUNCA escreve cookie aqui (só leitura)
export async function createClientServerRSC() {
  const store = await cookies() // Next 15: assíncrono
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      // sem set/remove aqui
    },
  })
}

// ➜ Use APENAS em Server Actions e Route Handlers (ex.: /auth/signout)
//    Aqui pode escrever cookie
export async function createClientServerAction() {
  const store = await cookies()
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: CookieOptions) => {
        store.set({ name, value, ...options })
      },
      remove: (name: string, options: CookieOptions) => {
        store.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
  })
}