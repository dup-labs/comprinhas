import Link from "next/link"
import { LIST_PALETTE } from "@/lib/colors"

const ListItem = ({onRename,onDelete,item,index,listLength}:any) => {
   const N = listLength
    const fromBottom = N - 1 - index                // índice contado de baixo pra cima
    const c = LIST_PALETTE[fromBottom % LIST_PALETTE.length]

  return(
    <li key={item.id} className={`flex items-start min-h-52 flex-col gap-3 p-5 pt-10 pb-10 -mt-16 md:-mt-0 ${c.bg} ${c.text} ${c.ring} rounded-4xl w-full max-w-full md:max-w-48  md:min-w-92 shadow-[0_-10px_20px_-10px_rgb(0_0_0/.25)]`}>
      <Link href={`/dashboard/${item.id}`} className="w-full">
      <div className="flex justify-between w-full items-center mb-2">
        <div className={`font-bold ${c.text} text-2xl`}>
          {item.name}
        </div>
        <div className="text-sm text-gray-600">
          <span className="bg-black text-amber-50 rounded-2xl p-2">R$ {(item.monthly_budget_cents/100).toFixed(2)}</span>
        </div>
      </div>
      </Link>
      <div className="flex gap-3 justify-end w-full">
        {/* <button 
          className="text-sm px-2 py-1 border rounded"
          onClick={() => onRename(item.id)}>
          Renomear
        </button> */}
        <button 
          className="text-sm px-2 py-1 border rounded"
          onClick={() => onDelete(item.id)}
        >
            Excluir
        </button>
      </div>
    </li>
  )
}

export default ListItem