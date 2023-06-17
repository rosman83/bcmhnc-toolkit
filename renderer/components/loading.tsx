import { Dna } from 'react-loader-spinner'
const Loading = function () {
  return (
    <div className='flex flex-col items-center justify-center h-full w-full'
    >
        <div className='flex flex-col items-center justify-center gap-3'>
          <div className='flex flex-col s items-center justify-center gap-3'>
            <Dna
              visible={true}
              height="80"
              width="80"
              ariaLabel="dna-loading"
              wrapperStyle={{}}
              wrapperClass="dna-wrapper"
            />
            <h1 className='text-xl font-bold'>Running function...</h1>
            <a>Please do not close this window and allow for a few minutes</a>
          </div>
        </div>
        <div className="hidden flex flex-row gap-2 items-center justify-center mt-4 ">
          <button disabled className='bg-gray-400 text-gray-600 p-1  w-max px-[32px]'>Cancel</button>
        </div>
      </div>
    )
  }

export default Loading;