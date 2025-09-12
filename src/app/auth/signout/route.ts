// src/app/auth/signout/route.ts
import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

function home(urlBase?: string) {
  // usa sua SITE_URL em prod; fallback pro localhost
  const base = urlBase || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return new URL('/', base)
}

export async function POST() {
  const supabase = await createClientServer()   // <-- await
  await supabase.auth.signOut()
  return NextResponse.redirect(home())
}

export async function GET() {
  const supabase = await createClientServer()   // <-- await
  await supabase.auth.signOut()
  return NextResponse.redirect(home())
}
