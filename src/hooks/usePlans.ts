'use client'

import { useEffect, useState } from 'react'

type Plan = 'free' | 'basic' | 'premium'

interface PlanLimits {
  maxLists: number | null
  maxBudgetCents: number | null
  maxSharedEmails: number | null
}

interface PlanData {
  plan: Plan
  limits: PlanLimits
}

export function usePlan() {
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadPlan() {
    try {
      setLoading(true)
      const res = await fetch('/api/plan/check', { credentials: 'include' })
      if (!res.ok) throw new Error('Falha ao carregar plano')
      const data = await res.json()
      setPlanData(data)
    } catch (err: any) {
      console.error('❌ usePlan error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlan()
  }, [])


  useEffect(() => {
    if (planData) {
      console.log('📊 Plano carregado:', planData.plan, planData.limits)
    }
  }, [planData])

  return {
    ...planData,
    loading,
    error,
    reload: loadPlan, // útil pra quando o user faz upgrade de plano
  }
}
