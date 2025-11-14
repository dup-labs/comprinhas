'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function PaymentMethodChart({ items, viewMode, setViewMode, monthParam }: any) {

  // === INTERVALO DO MÊS ===
  const y = parseInt(monthParam.slice(0, 4), 10)
  const m = parseInt(monthParam.slice(5, 7), 10)

  const monthStart = Date.UTC(y, m - 1, 1)
  const monthEnd = Date.UTC(m === 12 ? y + 1 : y, m % 12, 1)

  // === FILTRA SOMENTE COMPRADOS ===
  const filtered = items.filter((i: any) => {
    if (i.status !== 'bought') return false

    if (viewMode === 'all') return true

    const t = new Date(i.bought_at!).getTime()
    return t >= monthStart && t < monthEnd
  })

  // === AGREGA MÉTODOS ===
  const data = Object.entries(
    filtered.reduce((acc: any, i: any) => {
      const methods = i.payment_methods
      const name = Array.isArray(methods)
        ? methods[0]?.name || 'Sem método'
        : methods?.name || 'Sem método'

      acc[name] = (acc[name] || 0) + i.price_cents / 100
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="bg-white rounded-2xl shadow-gray-200 shadow-md p-4 mt-8">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-700 text-sm">
          Distribuição por método de pagamento
        </h3>

        <select
          value={viewMode}
          onChange={e => setViewMode(e.target.value)}
          className="text-xs border rounded p-1"
        >
          <option value="month">Mês atual</option>
          <option value="all">Geral</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>
          <Tooltip formatter={(v: any) => `R$ ${v.toFixed(2)}`} />
          <XAxis dataKey="name" angle={-25} textAnchor="end" height={50} />
          <YAxis />
          <Bar dataKey="value" fill="#719B07" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
