// src/lib/supabase-rsc.ts
import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createSupabaseRSC() {
  const cookieStore = cookies() // sem await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // normaliza o retorno para string | undefined
          const anyStore = cookieStore as any
          const c = typeof anyStore.get === 'function' ? anyStore.get(name) : undefined
          return typeof c === 'string' ? c : c?.value
        },
        // em RSC não pode escrever cookies
        set(_name: string, _value: string, _options: CookieOptions) {},
        remove(_name: string, _options: CookieOptions) {},
      },
    }
  )
}
