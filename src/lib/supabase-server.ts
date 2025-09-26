// src/lib/supabase-server.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server Components (só leitura)
export async function createClientServerRSC() {
  const store = await cookies() // ok
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      // sem set/remove aqui
    },
  })
}

// Server Actions / Route Handlers (pode escrever)
export async function createClientServerAction() {
  const store = await cookies() // ok
  return createServerClient(url, anon, {
    cookies: {
      get: (name: string) => store.get(name)?.value,

      // ⬇️ assinatura POSICIONAL no Next 15
      set: (name: string, value: string, options: CookieOptions) => {
        store.set(name, value, options as any)
      },

      // ⬇️ use delete(name). Fallback caso não exista (ambiente antigo)
      remove: (name: string, options: CookieOptions) => {
        if (typeof (store as any).delete === 'function') {
          ;(store as any).delete(name)
        } else {
          store.set(name, '', { ...(options as any), maxAge: 0 })
        }
      },
    },
  })
}
