import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { adminSecret, userId, lifetime } = await req.json()

    // segurança básica
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // define os valores
    const isLifetime = lifetime === true
    const expiresAt = isLifetime
      ? null
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano padrão

    // upsert no banco
    await supabase
      .from('user_plans')
      .upsert(
        {
          id: userId,
          plan: 'premium',
          is_lifetime: isLifetime,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    return NextResponse.json({
      success: true,
      message: `Usuário ${userId} agora é Premium${isLifetime ? ' vitalício' : ''}`,
    })
  } catch (err: any) {
    console.error('Erro no grant-premium:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
