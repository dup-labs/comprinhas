// import { createClientServer } from '@/lib/supabase-server'
import Lists from './Lists'
import OwnerEmailBackfill from '../components/OwnerEmailBackfill';

import { createClientServerRSC } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0



export default async function Dashboard() {
  const supabase = await createClientServerRSC(); // <- await aqui
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
      <OwnerEmailBackfill />
    </main>
  
  )
}



