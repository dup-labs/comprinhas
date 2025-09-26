const ActionButton = ({ text, onClick, type, className, href, newTab }: any) => {
  const icons: any = {
    undo: (
      <svg viewBox="0 0 24 24" className="w-4 h-4">
        <g>
          <path d="M21.75 14A6.758 6.758 0 0 1 15 20.75H5a.75.75 0 0 1 0-1.5h10c2.895 0 5.25-2.355 5.25-5.25S17.895 8.75 15 8.75H4.811l2.72 2.72a.75.75 0 0 1-1.06 1.061l-4-4a.75.75 0 0 1 0-1.061l3.999-4a.75.75 0 1 1 1.061 1.061l-2.72 2.72H15a6.758 6.758 0 0 1 6.75 6.75z" fill="#000000" opacity="1" data-original="#000000"></path>
        </g>
      </svg>
    ),
    remove: (
      <svg viewBox="0 0 512 512" className="w-4 h-4">
        <g>
          <path d="M424 64h-88V48c0-26.467-21.533-48-48-48h-64c-26.467 0-48 21.533-48 48v16H88c-22.056 0-40 17.944-40 40v56c0 8.836 7.164 16 16 16h8.744l13.823 290.283C87.788 491.919 108.848 512 134.512 512h242.976c25.665 0 46.725-20.081 47.945-45.717L439.256 176H448c8.836 0 16-7.164 16-16v-56c0-22.056-17.944-40-40-40zM208 48c0-8.822 7.178-16 16-16h64c8.822 0 16 7.178 16 16v16h-96zM80 104c0-4.411 3.589-8 8-8h336c4.411 0 8 3.589 8 8v40H80zm313.469 360.761A15.98 15.98 0 0 1 377.488 480H134.512a15.98 15.98 0 0 1-15.981-15.239L104.78 176h302.44z" fill="#000000" opacity="1" data-original="#000000"></path>
          <path d="M256 448c8.836 0 16-7.164 16-16V224c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16zM336 448c8.836 0 16-7.164 16-16V224c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16zM176 448c8.836 0 16-7.164 16-16V224c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16z" fill="#000000" opacity="1" data-original="#000000"></path>
        </g>
      </svg>
    ),
    see: (
      <svg viewBox="0 0 32 32" className="w-4 h-4">
        <g>
          <path d="M16 9.665c-3.493 0-6.335 2.842-6.335 6.335s2.842 6.335 6.335 6.335 6.335-2.842 6.335-6.335S19.493 9.665 16 9.665zm0 10.537c-2.317 0-4.202-1.885-4.202-4.202s1.885-4.202 4.202-4.202 4.202 1.885 4.202 4.202-1.885 4.202-4.202 4.202z" fill="#000000" opacity="1" data-original="#000000"></path>
          <path d="M16 5.5C9.24 5.5 3 9.443.103 15.547c-.137.29-.137.627 0 .917C3.01 22.56 9.25 26.5 16 26.5s12.99-3.94 15.896-10.036c.138-.29.138-.626 0-.917C29 9.444 22.76 5.5 16 5.5zm0 18.867c-5.761 0-11.1-3.266-13.743-8.362C4.892 10.902 10.23 7.633 16 7.633s11.108 3.27 13.743 8.372C27.1 21.1 21.76 24.367 16 24.367z" fill="#000000" opacity="1" data-original="#000000"></path>
        </g>
      </svg>
    ),
  }

  const content = (
    <>
      {icons[type] || null}
      {text}
    </>
  )

  const base =
    `flex w-auto text-xs text-nowrap flex items-center justify-between p-2 gap-2 rounded-2xl font-bold ${className}`

  // Se tiver href -> vira link (pode abrir em nova aba)
  if (href) {
    return (
      <a
        href={href}
        target={newTab ? '_blank' : '_self'}
        className={base}
        role="button"
      >
        {content}
      </a>
    )
  }

  // Senão -> continua botão
  return (
    <button className={base} onClick={onClick}>
      {content}
    </button>
  )
}

export default ActionButton