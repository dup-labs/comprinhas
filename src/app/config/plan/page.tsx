'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import { usePlan } from '../../..//hooks/usePlans'

export default function PlanConfigPage() {
  const supabase = createClientBrowser()
  const { plan, limits, loading } = usePlan()
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  // 🔍 Carrega user + token
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser()
      if (error) console.error('❌ Erro ao pegar user:', error)
      else {
        setUser(data.user)
        console.log('👤 Usuário logado:', data.user)
      }

      const session = (await supabase.auth.getSession()).data?.session
      const t = session?.access_token || null
      console.log('🔑 Access token ativo?', t ? '✅ sim' : '❌ não')
      console.log('🔑 Token preview:', t?.slice(0, 20) + '...')
      setToken(t)
    }

    loadUser()
  }, [supabase])

  async function handleUpgrade(selectedPlan: 'basic' | 'premium') {
    if (!user || !token) {
      alert('Usuário não autenticado.')
      return
    }

    console.log('🧩 Clique no upgrade:', selectedPlan)
    console.log('👤 Dados do user antes do checkout:', user)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ agora mandamos o token
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: 'BOLETO',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no checkout')

      console.log('💰 Retorno da API:', data)
      alert(`Link de pagamento: ${data.payment.invoiceUrl || 'gerado com sucesso'}`)
    } catch (err: any) {
      console.error('❌ Erro ao fazer upgrade:', err)
      alert(err.message)
    }
  }

  if (loading) return <p>Carregando plano...</p>

  return (
    <div className="p-6">
      <h2 className="text-center font-bold text-2xl mb-6">Seu plano atual</h2>

      <div className="flex justify-center gap-6">
        {['free', 'basic', 'premium'].map((p) => (
          <div
            key={p}
            className={`rounded-2xl border p-6 w-64 text-center ${
              plan === p ? 'bg-green-50 border-green-500' : 'bg-white'
            }`}
          >
            <h3 className="font-bold capitalize mb-2">{p}</h3>
            <p className="text-gray-500 text-sm mb-4">
              {p === 'free' && '2 listas / R$1000 total'}
              {p === 'basic' && '5 listas / 1 convidado'}
              {p === 'premium' && 'ilimitado'}
            </p>
            <p className="font-medium mb-4">
              {p === 'free' ? 'Grátis' : p === 'basic' ? 'R$ 8,99/mês' : 'R$ 39,90/mês'}
            </p>
            <button
              disabled={plan === p}
              onClick={() => handleUpgrade(p as 'basic' | 'premium')}
              className={`w-full py-2 rounded ${
                plan === p
                  ? 'bg-green-100 border border-green-500 text-green-700'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {plan === p ? 'Ativo ✅' : 'Fazer upgrade'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
