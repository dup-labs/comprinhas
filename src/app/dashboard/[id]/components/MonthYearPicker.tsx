'use client'

import { useRef, useEffect } from 'react'

const MONTHS = [
  'Jan','Fev','Mar','Abr','Mai','Jun',
  'Jul','Ago','Set','Out','Nov','Dez'
]

export default function MonthYearPicker({
  listName,
  selectedMonth,
  onChange,
}: {
  listName: string
  selectedMonth: string
  onChange: (v: string) => void
}) {
  // refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<(HTMLButtonElement | null)[]>([])

  // parse mês/ano atual
  const currentYear = Number(selectedMonth.slice(0, 4))
  const currentMonthIndex = Number(selectedMonth.slice(5, 7)) - 1

  function changeMonth(index: number) {
    const newMonth = String(index + 1).padStart(2, '0')
    onChange(`${currentYear}-${newMonth}`)
  }

  function changeYear(newYear: string) {
    const month = selectedMonth.slice(5, 7)
    onChange(`${newYear}-${month}`)
  }

  function scroll(dir: 'left' | 'right') {
    const container = scrollRef.current
    if (!container) return

    const amount = 120
    container.scrollLeft += dir === 'left' ? -amount : amount
  }

  // centralizar mês atual
  useEffect(() => {
    const container = scrollRef.current
    const current = monthRefs.current[currentMonthIndex]

    if (!container || !current) return

    const containerWidth = container.offsetWidth
    const monthLeft = current.offsetLeft
    const monthWidth = current.offsetWidth

    const targetScroll =
      monthLeft - containerWidth / 2 + monthWidth / 2

    container.scrollLeft = targetScroll
  }, [currentMonthIndex])

  return (
    <div className="w-full space-y-4 select-none">

      {/* título + seletor de ano */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {listName}
        </h2>

        <select
          value={currentYear}
          onChange={(e) => changeYear(e.target.value)}
          className="px-3 py-2 bg-gray-100 rounded-full text-sm"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const y = new Date().getFullYear() - 2 + i
            return <option key={y} value={y}>{y}</option>
          })}
        </select>
      </div>

      {/* meses scroll horizontal */}
      <div className="relative flex items-center bg-gray-100 rounded-full">

        {/* scroll left */}
        <button
          onClick={() => scroll('left')}
          className="px-2 text-gray-400 hover:text-gray-600"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto w-full no-scrollbar px-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {MONTHS.map((m, index) => {
            const active = index === currentMonthIndex

            return (
              <button
                key={m}
                ref={(el:any) => (monthRefs.current[index] = el)}
                onClick={() => changeMonth(index)}
                className={`
                  text-lg transition-all 
                  ${active ? 'font-semibold text-black scale-105' : 'text-gray-400'}
                `}
              >
                {m}
              </button>
            )
          })}
        </div>

        {/* scroll right */}
        <button
          onClick={() => scroll('right')}
          className="px-2 text-gray-400 hover:text-gray-600"
        >
          ›
        </button>
      </div>
    </div>
  )
}
