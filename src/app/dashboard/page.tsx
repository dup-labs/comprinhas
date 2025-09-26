// import { createClientServer } from '@/lib/supabase-server'
import Lists from './Lists'
import OwnerEmailBackfill from '../components/OwnerEmailBackfill';

import { createClientServerRSC } from '@/lib/supabase-server'
import Header from '../components/Header';

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
    <>
      <Header />
      <main className="p-6 w-full mx-auto">
        <Lists />
        <OwnerEmailBackfill />
      </main>
    </>
  
  )
}



