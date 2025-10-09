import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔐 usa a service role key
)

export async function POST(req: Request) {
  try {
    const data = await req.json()
    console.log('📩 Webhook recebido:', JSON.stringify(data, null, 2))

    const event = data.event
    const payment = data.payment

    if (!event || !payment) {
      return NextResponse.json({ message: 'Evento inválido' }, { status: 400 })
    }

    console.log(`🎯 Evento recebido: ${event}`)

    switch (event) {
      case 'PAYMENT_CONFIRMED': {
        console.log(`✅ Pagamento confirmado para ${payment.customer}`)
        const planType = payment.value >= 39.9 ? 'premium' : 'basic'

        await supabase
          .from('user_plans')
          .update({
            plan: planType,
            payment_status: 'CONFIRMED',
            updated_at: new Date().toISOString(),
          })
          .eq('asaas_payment_id', payment.id)

        break
      }

      case 'PAYMENT_OVERDUE':
      case 'SUBSCRIPTION_DELETED':
      case 'PAYMENT_REFUNDED': {
        console.log(`⚠️ Pagamento ${event}, revertendo plano para free`)

        await supabase
          .from('user_plans')
          .update({
            plan: 'free',
            payment_status: event,
            updated_at: new Date().toISOString(),
          })
          .eq('asaas_payment_id', payment.id)

        break
      }

      default:
        console.log(`ℹ️ Evento ignorado: ${event}`)
        break
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Erro no webhook:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
