'use client'

import { useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase-browser'

export default function OwnerEmailBackfill() {
  useEffect(() => {
    const run = async () => {
      try {
        // evita rodar toda hora no mesmo device
        if (localStorage.getItem('ownerEmailBackfillDone') === '1') return

        const supabase = createClientBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id || !user.email) return

        // atualiza TODAS as listas deste dono que estejam sem owner_email (null ou '')
        const { error } = await supabase
          .from('lists')
          .update({ owner_email: user.email })
          .eq('owner_id', user.id)
          .or('owner_email.is.null,owner_email.eq.')  // null OU string vazia

        if (!error) {
          localStorage.setItem('ownerEmailBackfillDone', '1')
        }
      } catch {
        // silent no MVP
      }
    }

    run()
  }, [])

  return null
}
