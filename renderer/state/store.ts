import { ipcRenderer } from "electron";
import { atom, useRecoilState } from 'recoil';

export const SETTINGS_genepattern = atom<any>({
  key: 'SETTINGS_genepattern',
  default: {},
});

export const SETTINGS_ssgsea = atom<any>({
  key: 'SETTINGS_ssgsea',
  default: {},
});

export const SEARCH_query = atom({
  key: 'SEARCH_q',
  default: '',
});

export const SEARCH_searchParams = atom({
  key: 'SEARCH_searchParams',
  default: ["name", "description", "path"]
});

export const SSGSEA_loading =  atom({
  key: 'SSGSEA_loading',
  default: false,
});

export const SSGSEA_reports = atom({
  key: 'SSGSEA_reports',
  default: [],
});

export const SSGSEA_gctFiles = atom({
  key: 'SSGSEA_gctFiles',
  default: [],
});

export const SSGSEA_geneSetFiles = atom({
  key: 'SSGSEA_geneSetFiles',
  default: [],
});

export const XPRA_loading = atom({
  key: 'XPRA_loading',
  default: false,
});

export const XPRA_files = atom({
  key: 'XPRA_files',
  default: [],
});

export const XPRA_threshold = atom({
  key: 'XPRA_threshold',
  default: 2,
});

export const XPRA_fdr = atom({
  key: 'XPRA_fdr',
  default: 0.1,
});

export const XPRA_uniqueGroups = atom({
  key: 'XPRA_uniqueGroups',
  default: [],
});

export const XPRA_topGroup = atom({
  key: 'XPRA_topGroup',
  default: '',
});

export const XPRA_ext = atom({
  key: 'XPRA_ext',
  default: 'results',
});

export const XPRA_reports = atom({ 
  key: 'XPRA_reports',
  default: [],
});