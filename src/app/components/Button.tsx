

const Button = ({text,onClick}:any) => {
  return(
    <button
      className="flex pt-2 pb-2 pl-12 pr-12 text-amber-50 bg-black rounded-4xl font-bold"
       onClick={onClick}>{text}</button>
  )
}

export default Button