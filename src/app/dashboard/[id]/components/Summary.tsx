'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import MonthYearPicker from './MonthYearPicker'
import BudgetEditor from './BudgetEditor'
import Link from 'next/link'

type Row = {
  price_cents: number
  status: 'pending' | 'selected' | 'bought'
  bought_at: string | null
  installments: number | null
}

export default function Summary({ listId, budgetCents,listName,isMobile }: { listId: string; budgetCents: number ,listName: string,isMobile:boolean}) {
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

  const spentPercent = (totalMonthCents / budgetCents) * 100

  const over =
    showPending && selectedVisibleCents > budgetCents - totalMonthCents

  return (
    <div className="p-4 bg-white rounded-2xl text-black-950 mb-0 shadow-[0_4px_14px_rgba(188,188,188,0.25)]">
      {/* Controles */}
      {/* <div className="flex items-center gap-4">
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
      </div> */}

      {isMobile && (
        <Link href="/dashboard" className="underline">← Voltar</Link>
      )}

      <MonthYearPicker
        selectedMonth={month}
        listName={listName}
        onChange={(v) => {
          router.push(`?month=${v}`)
        }}
      />

      {/* Resumo */}
      <div className='flex justify-between mb-6 mt-6'>
        <div className='flex flex-col w-1/3 items-center text-five-green-medium text-center'>
          <span className='text-black font-bold'>
            Orçamento
            </span>
          <strong className='text-md'>{fmt(budgetCents)}</strong>
          <BudgetEditor
              listId={listId}
              initialBudgetCents={budgetCents}
            />
        </div>
        <div className='flex flex-col w-1/3 items-center  text-five-gray-dark text-center'>
          <span className='text-black font-bold'>Gasto</span>
          <strong className='text-md'>{fmt(totalMonthCents)}</strong>
        </div>
        <div className='flex flex-col w-1/3 items-center text-five-green-dark text-center'>
          <span className='text-black font-bold'>Disponível</span>
          <strong className='text-md'>{fmt(remainingCents)}</strong>
        </div>
      </div>
      <div className="progress">
        <div className="w-full h-4 bg-five-green-medium rounded-full overflow-hidden">
          <div
            className="h-full bg-five-green-dark rounded-full"
            style={{ width: `${spentPercent}%` }}
          />
        </div>
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
