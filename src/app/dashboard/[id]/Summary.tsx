'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'

type Row = {
  price_cents: number
  status: 'pending' | 'selected' | 'bought'
  bought_at: string | null
  installments: number | null
}

function MonthPickerBR({
  valueYYYYMM,
  onChange,
}: {
  valueYYYYMM: string
  onChange: (nextYYYYMM: string) => void
}) {
  const months = [
    'janeiro','fevereiro','março','abril','maio','junho',
    'julho','agosto','setembro','outubro','novembro','dezembro'
  ]

  const initialYear = Number(valueYYYYMM?.slice(0, 4)) || new Date().getUTCFullYear()
  const initialMonth = Number(valueYYYYMM?.slice(5, 7)) || (new Date().getUTCMonth() + 1)

  const [year, setYear] = useState<number>(initialYear)
  const [month, setMonth] = useState<number>(initialMonth)

  useEffect(() => {
    const y = Number(valueYYYYMM?.slice(0, 4)) || initialYear
    const m = Number(valueYYYYMM?.slice(5, 7)) || initialMonth
    setYear(y)
    setMonth(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueYYYYMM])

  function emit(y: number, m: number) {
    const mm = String(m).padStart(2, '0')
    onChange(`${y}-${mm}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="month-select" className="text-sm font-medium">Mês:</label>
      <select
        id="month-select"
        aria-label="Mês"
        value={month}
        onChange={(e) => {
          const m = Number(e.target.value)
          setMonth(m)
          emit(year, m)
        }}
        className="border rounded px-2 py-1 bg-white"
      >
        {months.map((nome, idx) => (
          <option key={idx + 1} value={idx + 1}>
            {nome}
          </option>
        ))}
      </select>

      <input
        aria-label="Ano"
        type="number"
        value={year}
        onChange={(e) => {
          const y = Number(e.target.value) || year
          setYear(y)
          emit(y, month)
        }}
        className="w-24 border rounded px-2 py-1 bg-white"
      />
    </div>
  )
}

export default function Summary({ listId, budgetCents }: { listId: string; budgetCents: number }) {
  const supabase = createClientBrowser()
  const [rows, setRows] = useState<Row[]>([])

  const router = useRouter()
  const sp = useSearchParams()

  function currentMonthYYYYMM() {
    const now = new Date()
    const yyyy = String(now.getUTCFullYear())
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
    return `${yyyy}-${mm}`
  }

  const month = sp.get('month') ?? currentMonthYYYYMM()
  const showPending = sp.get('showPending') === 'true'

  async function load() {
    const { data, error } = await supabase
      .from('items')
      .select('price_cents,status,bought_at,installments')
      .eq('list_id', listId)

    if (error) {
      console.error(error)
      setRows([])
      return
    }
    setRows((data ?? []) as Row[])
  }

  useEffect(() => {
    load()
    const handler = () => load()
    window.addEventListener('items-changed', handler)
    return () => window.removeEventListener('items-changed', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId])

  // ✅ Cálculo principal
  const {
    selectedVisibleCents,
    boughtMonthCents,
    installmentsMonthCents,
    totalMonthCents,
    remainingCents,
  } = useMemo(() => {
    if (!rows.length) {
      return {
        selectedVisibleCents: 0,
        boughtMonthCents: 0,
        installmentsMonthCents: 0,
        totalMonthCents: 0,
        remainingCents: budgetCents,
      }
    }

    const y = parseInt(month.slice(0, 4), 10)
    const m = parseInt(month.slice(5, 7), 10)
    const monthStart = Date.UTC(y, m - 1, 1)
    const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)

    function inSelectedMonth(iso: string | null) {
      if (!iso) return false
      const t = new Date(iso).getTime()
      return t >= monthStart && t < monthEnd
    }

    let boughtMonth = 0
    let installmentsMonth = 0

    rows.forEach((r) => {
      if (r.status !== 'bought' || !r.bought_at) return
      const bought = new Date(r.bought_at)
      const installments = r.installments || 1
      const perMonth = r.price_cents / installments

      for (let i = 0; i < installments; i++) {
        const parcel = new Date(bought)
        parcel.setUTCMonth(bought.getUTCMonth() + i)

        const parcelTime = parcel.getTime()
        if (parcelTime >= monthStart && parcelTime < monthEnd) {
          if (i === 0 && inSelectedMonth(r.bought_at)) boughtMonth += perMonth
          else installmentsMonth += perMonth
        }
      }
    })

    const selectedVisible = showPending
      ? rows.filter((r) => r.status === 'selected').reduce((s, r) => s + (r.price_cents || 0), 0)
      : 0

    const totalMonth = boughtMonth + installmentsMonth
    const remaining = budgetCents - totalMonth - selectedVisible

    return {
      selectedVisibleCents: selectedVisible,
      boughtMonthCents: boughtMonth,
      installmentsMonthCents: installmentsMonth,
      totalMonthCents: totalMonth,
      remainingCents: remaining,
    }
  }, [rows, budgetCents, month, showPending])

  const fmt = (c: number) => `R$ ${(c / 100).toFixed(2)}`
  const getPct = (v: number) =>
    budgetCents > 0 ? `${((v / budgetCents) * 100).toFixed(1)}%` : '0%'

  const over =
    showPending && selectedVisibleCents > budgetCents - totalMonthCents

  return (
    <div className="rounded p-4 bg-purple-100 text-purple-950 mb-0">
      {/* Controles */}
      <div className="flex items-center gap-4">
        <MonthPickerBR
          valueYYYYMM={month}
          onChange={(next) => {
            const params = new URLSearchParams(sp)
            params.set('month', next)
            router.replace(`?${params.toString()}`, { scroll: false })
          }}
        />

        <div className="flex items-center gap-2">
          <input
            id="showPending"
            type="checkbox"
            checked={showPending}
            onChange={(e) => {
              const params = new URLSearchParams(sp)
              if (e.target.checked) params.set('showPending', 'true')
              else params.delete('showPending')
              router.replace(`?${params.toString()}`, { scroll: false })
            }}
            className="w-4 h-4"
          />
          <label htmlFor="showPending" className="text-sm">
            Exibir pendentes
          </label>
        </div>
      </div>

      {/* Resumo */}
      <div className="mt-3 font-semibold text-base">Resumo do mês</div>
      <div>💰 Orçamento: <b>{fmt(budgetCents)}</b></div>
      <div>🧾 Gastos parcelados: <b>{fmt(installmentsMonthCents)}</b> ({getPct(installmentsMonthCents)})</div>
      <div>🛒 Compras feitas no mês: <b>{fmt(boughtMonthCents)}</b> ({getPct(boughtMonthCents)})</div>
      <div>📊 Total de gastos do mês: <b>{fmt(totalMonthCents)}</b> ({getPct(totalMonthCents)})</div>
      <div className={remainingCents < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold'}>
        ✅ Saldo disponível: <b>{fmt(remainingCents)}</b> ({getPct(remainingCents)})
      </div>

      {showPending && (
        <div>
          🧩 Selecionados: <b>{fmt(selectedVisibleCents)}</b> ({getPct(selectedVisibleCents)})
        </div>
      )}
      {over && <div className="text-red-600 text-sm">Seleção acima do disponível do mês.</div>}
    </div>
  )
}
