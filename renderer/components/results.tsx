import { FolderOpenIcon, XMarkIcon } from "@heroicons/react/24/solid";

const ResultsLog = function (props) {
  // @param reports
  // @param func
  return (
    <div className='flex flex-col bg-white py-3 px-3 gap-3'>
              <div className='flex flex-col gap-2 p-1'>
                <div className='flex flex-col gap-2'>
                  <label className='font-xs mb-2'>Results Log</label>
                  <div className='flex flex-col gap-2 p-1'>
                    { (props.reports).map((report, i) => (
                      <div
                        key={i}
                        className={`rounded-sm py-2 px-6 flex flex-row items-center justify-between ${report.success ? 'bg-green-300' : 'bg-red-300'}`}>
                        <div>
                          <p className='font-light'>
                            {report.success ? `Your analysis report is ready, successfully created ${report.time.toLocaleTimeString()}` : `Your analysis report failed to create at ${report.time.toLocaleTimeString()}`}
                          </p>
                        </div>
                        <div>{/* 
                          { report.success &&
                            <button type='button' className='hover:bg-green-600 hover:bg-opacity-20 font-semibold py-2 px-4 rounded-md transition duration-200'>
                              <FolderOpenIcon className='h-4 w-4' />
                            </button>
                          } */}
                          {/* <button type='button'
                            onClick={() => props.func(report)}
                            className={`hover:bg-opacity-20 font-semibold py-2 px-4 rounded-md transition duration-200 ${report.success ? 'hover:bg-green-600' : 'hover:bg-red-600'}`}
                           >
                            <XMarkIcon className='h-4 w-4' />
                          </button> */}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-row gap-3 place-content-end">
                <button type="submit" className='bg-primary text-lg font-semibold text-secondary py-2  w-max px-36'>Run Task</button>
              </div>
            </div>
  )
}

export { ResultsLog };