'use client'
import { useRef } from 'react'

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

  const scrollRef = useRef<HTMLDivElement>(null)

  const currentYear = Number(selectedMonth.slice(0,4))
  const currentMonthIndex = Number(selectedMonth.slice(5,7)) - 1

  function changeMonth(index: number) {
    const newMonth = String(index + 1).padStart(2,'0')
    onChange(`${currentYear}-${newMonth}`)
  }

  function changeYear(newYear: string) {
    const month = selectedMonth.slice(5,7)
    onChange(`${newYear}-${month}`)
  }

  function scroll(dir: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = 80
    scrollRef.current.scrollLeft += dir === 'left' ? -amount : amount
  }

  return (
    <div className="w-full space-y-3">

      {/* top row: título + ano */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {listName}
        </h1>

        <select
          value={currentYear}
          onChange={(e) => changeYear(e.target.value)}
          className="px-3 py-2 bg-five-gray-light rounded-full text-sm"
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const y = new Date().getFullYear() - 2 + i
            return <option key={y} value={y}>{y}</option>
          })}
        </select>
      </div>

      {/* months horizontal scroll */}
      <div className="relative flex items-center bg-five-gray-light rounded-full p-2">
        
        <button
          onClick={() => scroll('left')}
          className="px-2 text-gray-400"
        >
          ‹
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar px-2"
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
                onClick={() => changeMonth(index)}
                className={`
                  text-lg px-2 cursor-pointer
                  ${active
                    ? 'font-bold text-black'
                    : 'text-gray-400'}
                `}
              >
                {m}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="px-2 text-gray-400"
        >
          ›
        </button>
      </div>
    </div>
  )
}
