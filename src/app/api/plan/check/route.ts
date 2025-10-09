import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 🔧 Define limites
const PLAN_LIMITS = {
  free: { maxLists: 2, maxBudgetCents: 1000 * 100, maxSharedEmails: 0 },
  basic: { maxLists: 5, maxBudgetCents: null, maxSharedEmails: 1 },
  premium: { maxLists: null, maxBudgetCents: null, maxSharedEmails: null },
}

export async function GET() {
  try {
    // cria client autenticado via cookies do usuário
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options as any)
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', { ...(options as any), maxAge: 0 })
          },
        },
      }
    )

    // pega o user autenticado via cookie
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.warn('⚠️ Usuário não autenticado no /api/plan/check')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // busca plano
    const { data: planData, error: planError } = await supabase
      .from('user_plans')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    if (planError) throw planError

    const plan = planData?.plan || 'free'
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free

    return NextResponse.json({ plan, limits })
  } catch (err: any) {
    console.error('❌ Erro no /api/plan/check:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
