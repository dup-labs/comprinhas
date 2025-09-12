import { createClientServer } from '@/lib/supabase-server'
import Lists from './Lists'

export default async function Dashboard() {
  const supabase = await createClientServer(); // <- await aqui
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return (
    <main className="p-6">
      Você precis estar logado. 
      <a href="/">Voltar</a>
    </main>
  )

  const { email } = user

  return (
    <main className="p-6 w-full mx-auto">
      <Lists />
    </main>
  
  )
}



