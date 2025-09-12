'use client'
import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'

type Row = { price_cents: number; status: 'pending'|'selected'|'bought'; bought_at: string|null }

export default function Summary({ listId, budgetCents }: { listId: string; budgetCents: number }) {
  const supabase = createClientBrowser()
  const [selected, setSelected] = useState(0)
  const [boughtMonth, setBoughtMonth] = useState(0)

  function sameMonth(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth()
  }

  async function load() {
    const { data } = await supabase
      .from('items')
      .select('price_cents,status,bought_at')
      .eq('list_id', listId)

    const rows = (data ?? []) as Row[]
    const sel = rows.filter(r => r.status === 'selected').reduce((s,r)=>s+r.price_cents, 0)
    const bought = rows
      .filter(r => r.status === 'bought' && r.bought_at && sameMonth(r.bought_at))
      .reduce((s,r)=>s+r.price_cents, 0)

    setSelected(sel)
    setBoughtMonth(bought)
  }

  useEffect(() => { load() }, [listId])

  // escuta mudanças vindas do Items.tsx
  useEffect(() => {
    const handler = (e: any) => { if (e?.detail === listId) load() }
    window.addEventListener('items-changed', handler)
    return () => window.removeEventListener('items-changed', handler)
  }, [listId])

  const remaining = budgetCents - selected - boughtMonth;   // <- sem Math.max
  const over = selected > (budgetCents - boughtMonth);
  const fmt = (c: number) => `R$ ${(c/100).toFixed(2)}`;

  return (
    <div className="rounded p-4 bg-purple-100 text-purple-950 space-y-1">
      <div className="font-semibold">Resumo do mês</div>
      <div>Orçamento: <b>{fmt(budgetCents)}</b></div>
      <div>Selecionados: <b>{fmt(selected)}</b></div>
      <div>Comprado no mês: <b>{fmt(boughtMonth)}</b></div>
      <div className={remaining < 0 ? 'text-red-600 font-semibold' : ''}>
        Restante: <b>{fmt(remaining)}</b> {/* fica negativo se estourar */}
      </div>
      {over && <div className="text-red-600 text-sm">Seleção acima do disponível do mês.</div>}
    </div>
  );
}