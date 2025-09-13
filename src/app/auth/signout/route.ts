import { NextResponse } from 'next/server'
import { createClientServer } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createClientServer()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url), { status: 302 })
}

export async function GET(req: Request) {
  const supabase = await createClientServer()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url), { status: 302 })
}