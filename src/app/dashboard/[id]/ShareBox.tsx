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
    <div className="rounded-2xl p-6 space-y-3 bg-white">
      <h3 className="font-medium">Compartilhar por e-mail</h3>
      <form onSubmit={addEmail} className="flex gap-2 mb-6">
        <input
          className="flex-1 rounded-full bg-gray-50 border-gray-300 border-1 p-2"
          placeholder="ex: lari@gmail.com"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')}
        />
        <button
          className={`rounded-full px-3 py-2 text-white ${
            planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-five-green-medium hover:bg-five-green-dark'
          }`}
          disabled={planLoading || (limits?.maxSharedEmails === 0 && plan === 'free')}
        >
          Convidar
        </button>
      </form>

      <ul className="flex flex-wrap gap-2">
        {emails.map((mail) => (
          <li key={mail} className="bg-white p-4 rounded-full shadow-[0_4px_14px_rgba(188,188,188,0.25)] w-full flex justify-between">
            <span>{mail}</span>
            <button
              type="button"
              onClick={() => removeEmail(mail)}
              className="text-sm bg-gray-100 pl-4 pr-4 rounded-full"
              title="Remover"
            >
              Remover
            </button>
          </li>
        ))}
        {emails.length === 0 && <li className="bg-white p-4 rounded-full shadow-[0_4px_14px_rgba(188,188,188,0.25)] w-full flex justify-center">Sem compartilhamento.</li>}
      </ul>

      {/* feedback do limite */}
      {limits?.maxSharedEmails !== null && (
        <p className="text-xs text-gray-600 text-center">
          {planLoading ? 
            'Carregando limites do seu plano...'
          : 
            plan === 'premium' ? 
              <span>
                Plano Premium: compartilhamento ilimitado 🚀
              </span>
            : 
              <span className='text-center'>
                Você pode compartilhar com até <strong> {limits?.maxSharedEmails ?? 0} {limits?.maxSharedEmails === 1 ? 'pessoa' : 'pessoas'} </strong> no plano <strong>{plan}</strong>.
              </span>
          }
        </p>
      )}
    </div>
  )
}
