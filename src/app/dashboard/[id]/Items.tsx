'use client'
export default function Items({
  items,
  onAdd,
  onToggleSelect,
  onDelete,
  onUndo,
  onEditCategory,
  onEditPayment,
}: any) {
  const fmt = (c?: number) => `R$ ${(Number(c ?? 0) / 100).toFixed(2)}`

  return (
    <section className="p-8">
      {/* <div className="flex items-center justify-between gap-2">
        <button onClick={onAdd} className="px-3 py-3 bg-white rounded shadow">
          Novo item
        </button>
      </div> */}

      <ul className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((i: any) => (
          <li
            key={i.id}
            className={`bg-white p-4 rounded shadow ${
              i.status === 'bought' ? 'opacity-50 bg-green-100' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={i.status === 'selected'}
                onChange={() => onToggleSelect(i)}
                className="cursor-pointer"
              />

              <div className="flex-1">
                <p>{i.title}</p>
                {i.category?.name && (
                  <span className="text-xs text-gray-500">
                    {i.category.name}
                  </span>
                )}
                {i.payment_methods?.[0]?.name && (
                  <span className="text-xs text-gray-600">
                    via {i.payment_methods[0].name}
                  </span>
                )}
              </div>

              <span>{fmt(i.price_cents)}</span>
            </div>

            <div className="flex justify-end gap-4 mt-2 text-xs">
              {i.status === 'bought' && (
                <button onClick={() => onEditPayment(i)}>
                  Editar pagamento
                </button>
              )}

              <button onClick={() => onEditCategory(i)}>
                Editar categoria
              </button>

              {i.status === 'bought' ? (
                <button onClick={() => onUndo(i)}>Desfazer</button>
              ) : (
                <button onClick={() => onDelete(i.id)}>Remover</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
