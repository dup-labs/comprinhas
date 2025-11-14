import { NextResponse } from 'next/server'
import { createClientServerAction } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClientServerAction()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}

export async function POST() {
  const supabase = await createClientServerAction()
  await supabase.auth.signOut()
  console.log('deslogar')
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))
}