import Link from "next/link";
import Tools from "../tools.config";
import { useRecoilState } from "recoil";
import { SEARCH_query, SEARCH_searchParams } from "../state/store";

export const SearchPanel = () => {
  const [q, setQ] = useRecoilState(SEARCH_query);
  const [searchParam] = useRecoilState(SEARCH_searchParams)
  
  function search(items) {
    return items.filter((item) => {
      return searchParam.some((newItem) => {
        return (
          item[newItem].toString().toLowerCase().indexOf(q.toLowerCase()) > -1
        );
      });
    });
  }

  return (
    <div className='flex flex-col p-1 w-full h-full'>
      <SearchBar q={q} setQ={setQ} />
      <SearchScroll>
        {(search(Tools)).map((item, i) => (
          <SearchItem key={i} name={item.name} description={item.description} path={item.path} />
        ))}
      </SearchScroll>
    </div>
  );
}

const SearchBar = ({q, setQ}) => {
  return (
    <div className='flex flex-col p-4 gap-3'>
          <h1 className='text-xl'>Welcome to the Frederick & Sandulache Lab Toolkit.</h1>
          <div className='flex flex-row gap-2'>
        <input className='flex-grow p-2 ' type='text' placeholder='Search for a tool...'
        value={q}
        onChange={(e) => setQ(e.target.value)}
        />
            <button className='p-2 bg-primary text-white'>Search</button>
          </div>
        </div>
  );
}

const SearchScroll = (props) => {
  return (
    <div className='flex flex-col items-center overflow-y-scroll gap-3 px-4 py-t h-full w-full pb-12'>
      {props.children} 
    </div>
  );
}

const SearchItem = (props) => {
  return (
    <div className='flex flex-col gap-3 w-full'>
          <div className='flex flex-col gap-2'>
              <div className="bg-primary grid grid-cols-1 divide-y px-3 py-3 text-gray-200 select-none transition duration-50 hover:scale-[101%] hover:text-white cursor-pointer">
              <Link href={props.path} className='text-md font-semibold mb-2'>{props.name}</Link>
                <div className='pt-2'>
                  <p className='text-sm truncate'>{props.description}</p>
                </div>
              </div>
            
          </div>
        </div>
  );
}