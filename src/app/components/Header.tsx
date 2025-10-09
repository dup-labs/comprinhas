'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o menu clicando fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="flex justify-between items-center p-6 border-b bg-white relative">
      <h1 className="flex gap-2 items-center">
        <img src="/logo.svg" alt="Five" className="h-10 w-auto" />
        <span className="font-semibold text-2xl">Five</span>
      </h1>

      {/* Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="px-3 py-2 rounded border flex items-center gap-2 hover:bg-gray-100"
        >
          <span className="hidden sm:inline">Menu</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform ${
              menuOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-md py-2 z-50">
            <Link
              href="/config/plan"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-100 text-sm"
            >
              ⚙️ Gerenciar plano
            </Link>

            {/* Futuro: perfil */}
            {/* <Link
              href="/config/profile"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 hover:bg-gray-100 text-sm"
            >
              🧍‍♂️ Perfil
            </Link> */}

            <form
              action="/auth/signout"
              method="post"
              onSubmit={() => setMenuOpen(false)}
            >
              <button
                type="submit"
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                🚪 Sair
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
