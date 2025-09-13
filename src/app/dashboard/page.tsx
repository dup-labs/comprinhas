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
      <form action="/auth/signout" method="post" className='flex mt-10 justify-end'>
        <button type="submit" className="px-3 py-2 rounded border">Sair</button>
      </form>
    </main>
  
  )
}



