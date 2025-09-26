import { NextResponse } from 'next/server'
import { createClientServerAction } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  if (code) {
    const supabase = await createClientServerAction(); // <- await aqui
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL('/dashboard', req.url))
}