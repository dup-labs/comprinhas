// src/lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { CookieOptions } from '@supabase/ssr'

export const createClientServer = async () => {
  const store = await cookies() // <- apenas aqui é async

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // métodos SÍNCRONOS (sem async)
        get(name: string) {
          return store.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          store.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          store.set({ name, value: '', ...options })
        },
      },
    }
  )
}