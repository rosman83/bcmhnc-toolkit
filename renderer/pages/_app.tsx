import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { RecoilRoot, useRecoilState } from 'recoil';

import '../styles/globals.css';
import Shell from '../components/shell';
import { ipcRenderer } from 'electron';
import useRunOnce from '../state/hooks';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Shell>
        <Component {...pageProps} />
      </Shell>
    </RecoilRoot>
  );
}

export default MyApp
