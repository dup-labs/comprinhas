

const Header = () => {
  return(
     <header>
        <form action="/auth/signout" method="post" className='flex justify-between p-6'>
          <h1 className='flex gap-2 items-center'>
            <img src="/logo.svg" alt="Comprinhas" className="h-12 w-auto" />
            <span className='text-bold text-2xl'>Comprinhas</span>
          </h1>
          <button type="submit" className="px-3 py-2 rounded border">Sair</button>
        </form>
      </header>
  )
}

export default Header
