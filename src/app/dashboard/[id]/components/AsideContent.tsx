// AsideContent.tsx
'use client'

import Link from "next/link"
import Summary from './Summary'
import BudgetEditor from './BudgetEditor'
import { ShareBox } from './ShareBox'
import CategoryChart from './CategoryChart'
import PaymentMethodChart from './PaymentMethodChart'
import { usePlan } from '../../../../hooks/usePlans'
import { useSearchParams, useRouter } from 'next/navigation'

export default function AsideContent({
  isMobile,
  user,
  list,
  listId,
  budgetCents,
  items,
  viewMode,
  setViewMode,
  monthParam,
  onNewItem,
  textForNewItemButton = "Novo item"
}: any) {

  const { plan, loading: planLoading } = usePlan()
  const router = useRouter()

  return (
    <div className="w-full space-y-4">
      {/* <Link href="/dashboard" className="underline">← Voltar</Link> */}

      {/* <h1 className="text-xl font-semibold">{list.name}</h1>

      <button
        onClick={onNewItem}
        className="px-3 py-2 bg-black text-white rounded text-xs"
      >
        {textForNewItemButton}
      </button> */}
      <div className="pb-4">
        <Summary listId={listId} budgetCents={budgetCents} listName={list.name} isMobile={isMobile} />
      </div>

      {/* <p className="text-sm text-gray-500">
        Criado por{' '}
        {list.owner_email
          ? user?.email === list.owner_email
            ? 'você'
            : list.owner_email
          : user?.id === list.owner_id
            ? 'você'
            : 'desconhecido'}
      </p> */}

      <ShareBox listId={listId} initialEmails={list.shared_emails ?? []} />

      {/* GRÁFICOS COM BLOQUEIO DO PLANO */}
      {planLoading 
        ? 'Carregando limites do seu plano...'
        : (
          <div className="relative">
            <div className={
              plan !== 'premium'
                ? 'pointer-events-none blur-sm'
                : ''
            }>
              <CategoryChart
                items={items}
                viewMode={viewMode}
                setViewMode={setViewMode}
                monthParam={monthParam}
              />

              <PaymentMethodChart
                items={items}
                viewMode={viewMode}
                setViewMode={setViewMode}
                monthParam={monthParam}
              />
            </div>

            {plan !== 'premium' && (
              <div className="absolute inset-0 flex items-center justify-center flex-col p-10 text-center gap-4 bg-white/40 backdrop-blur-sm rounded-xl">
                Quer dados detalhados sobre seus gastos?
                <button
                  onClick={() => router.push('/config/plan')}
                  className="px-4 py-2 bg-black text-white rounded-full"
                >
                  Clique aqui e atualize seu plano
                </button>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}
