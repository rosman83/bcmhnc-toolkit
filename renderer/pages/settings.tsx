import { ipcRenderer } from "electron";
import { use, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { SETTINGS_genepattern, SETTINGS_ssgsea } from "../state/store";

const GenePatternSettings = function () {
  const [settings, setSettings] = useRecoilState(SETTINGS_genepattern);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    ipcRenderer.invoke('get-settings', 'genepattern').then((result) => {
      setSettings(result);
    })
  }, [])

  function saveSettings() {
    ipcRenderer.invoke('set-settings', 'genepattern', settings)
    setSaved(true);
  }

  return (
    <form
      onChange={() => setSaved(false)}
      className='grid gap-2 gap flex flex-col py-2 px-2'>
      <a className='font-semibold select-none text-lg'>GenePattern Settings</a>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Server Host URL</label>
        <input className='bg-gray-100 py-1 px-2' type='text' value={settings.url}
          onChange={(e) => setSettings({ ...settings, url: e.target.value })}
          id="url" />
      </div>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Username</label>
        <input className='bg-gray-100 py-1 px-2' type='text' value={settings.username} onChange={(e) => setSettings({ ...settings, username: e.target.value })} />
      </div>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64'>Password</label>
        <input id='password' className='bg-gray-100 py-1 px-2' type='text' value={settings.password} onChange={(e) => setSettings({ ...settings, password: e.target.value })} />
      </div>
      <button
        disabled={saved}
        className={`text-white py-2 px-4 ${saved ? 'bg-secondary' : 'bg-primary'}`} onClick={saveSettings}>Save Settings</button>
    </form>
  )
}

const SSGSEASettings = function () {
  const [settings, setSettings] = useRecoilState(SETTINGS_ssgsea);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    ipcRenderer.invoke('get-settings', 'ssgsea').then((result) => {
      setSettings(result);
    })
  }, [])

  function saveSettings() {
    ipcRenderer.invoke('set-settings', 'ssgsea', settings)
    setSaved(true);
  }

  return (
    <form className='grid gap-2 gap flex flex-col py-2 px-2'
      onChange={() => setSaved(false)}
    >
      <a className='font-semibold select-none text-lg'>ssGSEA Defaults</a>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Sample Normalization Method</label>
        <input className='bg-gray-100 py-1 px-2' type='text' id="sample_normalization_method"
          value={settings.sample_normalization_method}
          onChange={(e) => setSettings({ ...settings, sample_normalization_method: e.target.value })}
        />
      </div>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Weighting Exponent</label>
        <input className='bg-gray-100 py-1 px-2' type='text' id="weighting_exponent"
          value={settings.weighting_exponent} onChange={(e) => setSettings({ ...settings, weighting_exponent: e.target.value })}
        />
      </div>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Minimum Gene Set Size</label>
        <input className='bg-gray-100 py-1 px-2' type='text' id="min_gene_set_size"
        value={settings.min_gene_set_size} onChange={(e) => setSettings({ ...settings, min_gene_set_size: e.target.value })}
        />
      </div>
      <div className='flex flex-row px-2 py-2  items-center gap-3'>
        <label className='w-64' >Combine Mode</label>
        <input className='bg-gray-100 py-1 px-2' type='text' id="combine_mode"
        value={settings.combine_mode} onChange={(e) => setSettings({ ...settings, combine_mode: e.target.value })}
        />
      </div>
      <button
        disabled={saved}
        className={`text-white py-2 px-4 ${saved ? 'bg-secondary' : 'bg-primary'}`} onClick={saveSettings}>Save Settings</button>
    </form>
  )
}

function Settings() {
  return (
    <>
      <div className='flex flex-col p-4 gap-2'>
        <div className='flex flex-col bg-white py-3 px-3 gap-3 divide-y'>
          <GenePatternSettings />
          <SSGSEASettings />
        </div>
      </div>
    </>
  )
}

export default Settings;