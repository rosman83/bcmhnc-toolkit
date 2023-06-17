const ItemLabel = function (props) {
  return (
    <div className='py-3 px-4 rounded-lg  w-full flex flex-col gap-5'>
      <a className=''>{props.children}</a>
    </div>
  )
}

export { ItemLabel };