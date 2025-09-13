'use client'
import { useState } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export function ShareBox({ listId, initialEmails }: { listId: string; initialEmails: string[] }) {
  const supabase = createClientBrowser()
  const router = useRouter()
  const [emails, setEmails] = useState<string[]>(initialEmails || [])
  const [input, setInput] = useState('')

  function normalize(email: string) {
    return email.trim().toLowerCase()
  }

  async function addEmail(e: React.FormEvent) {
    e.preventDefault()
    const email = normalize(input)
    if (!email) return
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
        />
        <button className="rounded bg-black px-3 py-2 text-white">Adicionar</button>
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
    </div>
  )
}
