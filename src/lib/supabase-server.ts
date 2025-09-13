import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

export async function createClientServer() {
  const store = await cookies() // <-- AGORA COM await

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => store.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          store.set({ name, value, ...options })
        },
        remove: (name: string, options: CookieOptions) => {
          store.set({ name, value: '', ...options, maxAge: 0 })
        },
      },
    }
  )
}