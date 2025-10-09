'use client'
import { useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import { usePlan } from '../../../hooks/usePlans'

export function ShareBox({ listId, initialEmails }: { listId: string; initialEmails: string[] }) {
  const supabase = createClientBrowser()
  const router = useRouter()
  const [emails, setEmails] = useState<string[]>(initialEmails || [])
  const [input, setInput] = useState('')

  // hook de plano
  const { plan, limits, loading: planLoading, error: planError } = usePlan()

  function normalize(email: string) {
    return email.trim().toLowerCase()
  }

  async function addEmail(e: React.FormEvent) {
    e.preventDefault()
    const email = normalize(input)
    if (!email) return

    // ⚙️ Regra de plano
    const maxShared = limits?.maxSharedEmails ?? null

    if (planLoading) {
      alert('Carregando informações do seu plano...')
      return
    }

    if (plan === 'free' && (!maxShared || maxShared <= 0)) {
      alert('O plano Free não permite compartilhamento. Faça upgrade para o plano Basic ou Premium.')
      return
    }

    if (maxShared !== null && maxShared > 0 && emails.length >= maxShared) {
      alert(
        `Limite de compartilhamentos atingido no seu plano (${maxShared}). ` +
          'Remova alguém ou faça upgrade para o plano Premium.'
      )
      return
    }

    const next = Array.from(new Set([...emails, email]))
    const { error } = await supabase.from('lists').update({ shared_emails: next }).eq('id', listId)
    if (error) return alert(error.message)
    setEmails(next)
    setInput('')
    router.refresh()
  }

  async function removeEmail(email: string) {
    const next = emails.filter((x) => x !== email)
    const { error } = await supabase.from('lists').update({ shared_emails: next }).eq('id', listId)
    if (error) return alert(error.message)
    setEmails(next)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border p-3 space-y-3">
      <h3 className="font-medium">Compartilhar por e-mail</h3>
      <form onSubmit={addEmail} className="flex gap-2">
        <input
          className="flex-1 rounded border p-2"
          placeholder="ex: lari@gmail.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')}
        />
        <button
          className={`rounded px-3 py-2 text-white ${
            planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          }`}
          disabled={planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')}
        >
          Adicionar
        </button>
      </form>

      <ul className="flex flex-wrap gap-2">
        {emails.map((mail) => (
          <li key={mail} className="flex items-center gap-2 rounded-full border px-3 py-1">
            <span>{mail}</span>
            <button
              type="button"
              onClick={() => removeEmail(mail)}
              className="text-sm opacity-70 hover:opacity-100"
              title="Remover"
            >
              ×
            </button>
          </li>
        ))}
        {emails.length === 0 && <li className="text-sm text-gray-500">Sem compartilhamento.</li>}
      </ul>

      {/* feedback do limite */}
      {limits?.maxSharedEmails !== null && (
        <p className="text-xs text-gray-600">
          {planLoading
            ? 'Carregando limites do seu plano...'
            : plan === 'premium'
            ? 'Plano Premium: compartilhamento ilimitado 🚀'
            : `Você pode compartilhar com até ${limits.maxSharedEmails || 0} ${
                limits.maxSharedEmails === 1 ? 'pessoa' : 'pessoas'
              } no plano ${plan}.`}
        </p>
      )}
    </div>
  )
}
