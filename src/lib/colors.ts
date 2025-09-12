export const LIST_PALETTE = [
  { bg: 'bg-brand-yellow', text: 'text-brand-yellow-fg', ring: 'ring-brand-yellow-ring' },
  { bg: 'bg-brand-green',  text: 'text-brand-green-fg',  ring: 'ring-brand-green-ring'  },
  { bg: 'bg-brand-red',    text: 'text-brand-red-fg',    ring: 'ring-brand-red-ring'    },
  { bg: 'bg-brand-blue',   text: 'text-brand-blue-fg',   ring: 'ring-brand-blue-ring'   },
  { bg: 'bg-brand-pink',   text: 'text-brand-pink-fg',   ring: 'ring-brand-pink-ring'   },
]

// hash djb2 simples — estável pra string
export function hashString(str: string) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i)
  return Math.abs(h)
}

export function getListColors(key: string) {
  const idx = hashString(key) % LIST_PALETTE.length
  return LIST_PALETTE[idx]
}