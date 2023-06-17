import Head from "next/head";
import Image from "next/image";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";

import BaylorLogo from "../public/logo.svg";
import Tools from "../tools.config";
import Link from "next/link";
import { useRouter } from "next/router";

function Shell(props) {  
  // get current page route
  const router = useRouter();
  const route = router.pathname;

  return (
    <div className="">
      <Head>
        <title>Frederick/Sandulache Lab Toolkit</title>
      </Head>
      <div className='flex flex-col h-screen w-screen'>
        <div className="px-6 py-4">
          <div className='flex flex-row w-full h-full items-center gap-4'>
            <Image width={'48'} height={'48'} src={BaylorLogo} alt="Baylor College of Medicine"/>
            <h1 className='text-2xl'>Frederick & Sandulache Lab</h1>
          </div>
        </div>
      {/* Tab panel */}
      <ul className='px-4 pt-4 bg-primary flex flex-wrap text-sm font-medium text-center text-gray-500'>
        <li className="">
            <a href="/home" className={`inline-block pb-3 p-2 px-6 ${ (route == '/home') ? "active bg-gray-100 text-gray-600 " : "transition duration-200 hover:bg-gray-300"}`}>Welcome</a>
        </li>
        {(Tools.map((tool, i) => (
          <li className="mr-2" key={i}>
            <Link href={tool.path} className={`inline-block pb-3 p-2 px-6 ${ (route == tool.path) ? "active bg-gray-100 text-gray-600" : "transition duration-200 hover:bg-gray-300"}`}>{tool.name}</Link>
          </li>
        )))}
        <li className="">
            <a href="/settings" className={`inline-block pb-3 p-2 px-6 flex items-center justify-center ${(route == '/settings') ? "active bg-gray-100 text-gray-600 " : "transition duration-200 hover:bg-gray-300"}`}>
              <Cog6ToothIcon className='inline-block w-5 h-5' />
          </a>
        </li>
      </ul>
      <div className='h-full overflow-y-scroll  bg-gray-200'>
        {props.children}
      </div>
      </div>
    </div>
  );
}

export default Shell;