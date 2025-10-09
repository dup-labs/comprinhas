import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ASAAS_API = process.env.NEXT_PUBLIC_ASAAS_API!
const ASAAS_TOKEN = process.env.ASAAS_TOKEN!

export async function POST(req: Request) {
  console.log('\n🧾 === INÍCIO DO CHECKOUT ===')

  try {
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '').trim()
    console.log('🔑 Header Authorization recebido?', !!authHeader)
    console.log('🔑 Token (preview):', token?.slice(0, 20) + '...')

    if (!token) {
      console.log('🚫 Sem token, encerrando.')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      console.log('❌ Erro ao pegar usuário:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = userData.user
    const { plan, paymentMethod } = await req.json()
    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário Five'
    const email = user.email!
    const cpf = user.user_metadata?.cpf || '12345678909'

    console.log('👤 Usuário:', { name, email, cpf, plan, paymentMethod })

    // 🔍 Verifica cliente existente no Asaas
    const existingRes = await fetch(`${ASAAS_API}/customers?email=${email}`, {
      headers: { access_token: ASAAS_TOKEN! },
    })
    const existingData = await existingRes.json()
    const existing = existingData.data?.[0]
    let customerId = existing?.id

    // ➕ Cria cliente se não existir
    if (!customerId) {
      console.log('➕ Criando novo cliente...')
      const customerRes = await fetch(`${ASAAS_API}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: ASAAS_TOKEN!,
        },
        body: JSON.stringify({
          name,
          email,
          cpfCnpj: cpf,
        }),
      })
      const newCustomer = await customerRes.json()
      console.log('📩 Novo cliente criado:', newCustomer)

      if (!newCustomer.id)
        throw new Error(`Falha ao criar cliente: ${JSON.stringify(newCustomer)}`)

      customerId = newCustomer.id
    } else {
      console.log('✅ Cliente existente:', customerId)

      if (!existing.cpfCnpj) {
        console.log('🧩 Cliente sem CPF, atualizando...')
        const updateRes = await fetch(`${ASAAS_API}/customers/${customerId}`, {
          method: 'POST', // o Asaas aceita POST como update
          headers: {
            'Content-Type': 'application/json',
            access_token: ASAAS_TOKEN!,
          },
          body: JSON.stringify({ cpfCnpj: cpf }),
        })
        const updateData = await updateRes.json()
        console.log('🔄 Atualização CPF:', updateData)
      }
    }

    console.log('✅ Cliente pronto:', customerId)

    const price = plan === 'premium' ? 39.9 : 8.99

    // 💰 Cria cobrança
    console.log('💰 Enviando cobrança...')
    const paymentRes = await fetch(`${ASAAS_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: ASAAS_TOKEN!,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: paymentMethod || 'BOLETO',
        value: price,
        description: `Plano ${plan.toUpperCase()} - Five`,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        externalReference: user.id, // 🔗 vincula o pagamento ao usuário
      }),
    })

    const paymentData = await paymentRes.json()
    console.log('📤 Resposta cobrança:', paymentData)

    if (!paymentData.id)
      throw new Error(`Erro ao gerar pagamento: ${JSON.stringify(paymentData)}`)

    // 🧠 Salva a cobrança sem alterar o plano atual
    await supabase
      .from('user_plans')
      .upsert(
        {
          id: user.id,
          asaas_customer_id: customerId,
          asaas_payment_id: paymentData.id,
          payment_status: paymentData.status, // deve começar como 'PENDING'
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    console.log('💾 Cobrança registrada (status pendente)')
    return NextResponse.json({ success: true, payment: paymentData })
  } catch (err: any) {
    console.error('❌ ERRO NO CHECKOUT:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    console.log('🧾 === FIM DO CHECKOUT ===\n')
  }
}
