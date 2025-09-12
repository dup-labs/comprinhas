import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-quicksand)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config