import React from 'react';
import { SearchPanel } from '../components/search';

// Fix SSR Issues to prepare for production
function Home() {
  return (
    <SearchPanel />
  );
}

export default Home;
