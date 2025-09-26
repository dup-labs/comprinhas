'use server'

import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function createSupabaseAction() {
  const cookieStore = await cookies() // Next 15: agora é assíncrono

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Next: assinatura posicional
          cookieStore.set(name, value, options as any)
        },
        remove(name: string, options: CookieOptions) {
          // Next 15: delete disponível em Server Actions
          if (typeof cookieStore.delete === 'function') {
            cookieStore.delete(name)
          } else {
            // fallback
            cookieStore.set(name, '', { ...(options as any), maxAge: 0 })
          }
        },
      },
    }
  )
}
