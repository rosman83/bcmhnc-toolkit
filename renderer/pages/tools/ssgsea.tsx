import { useState } from "react";
import { FilePond } from 'react-filepond';
import Loading from "../../components/loading";
import { ItemLabel } from "../../components/text";
import { ResultsLog } from "../../components/results";
import { ipcRenderer } from "electron";
import { SSGSEA_loading, SSGSEA_reports, SSGSEA_gctFiles, SSGSEA_geneSetFiles } from "../../state/store";
import { useRecoilState} from "recoil";


// Migrate to https://github.com/rpldy/react-uploady to prepare for production?
function ssGSEA() {
  const [loading, setLoading] = useRecoilState(SSGSEA_loading);
  const [reports, setReports] = useRecoilState(SSGSEA_reports);
  const [gctFiles, setGctFiles] = useRecoilState(SSGSEA_gctFiles);
  const [geneSetFiles, setGeneSetFiles] = useRecoilState(SSGSEA_geneSetFiles);

  async function handleRun() { 
    if (gctFiles.length < 1 || geneSetFiles.length < 1) {
      alert("Please select a GCT file and Gene Set Database file");
      return;
    }

    await ipcRenderer.send('ssgsea-message', {
      gctFile: gctFiles.map((file) => file.file.path),
      geneSetFile: geneSetFiles.map((file) => file.file.path),
    });

    setLoading(true);

    ipcRenderer.once('ssgsea-reply', (event, arg) => {
      const newReport = {
        time: arg.time,
        success: arg.success,
      }

      if (arg.success) {
        // prompt user to save file to disk using window
        ipcRenderer.send('save-file', {
          title: 'Save ssGSEA Report',
          defaultPath: 'ssgsea-report.gct',
          filters: [
            { name: 'GCT Files', extensions: ['gct'] },
          ],
          content: arg.file,
        });
      }
        
      setReports([...reports, newReport]);
      setLoading(false);
    });
  }
  
  function handleFunc() { }

  return (
    <>
      {loading ? <Loading /> :
         <form
          onSubmit={async (e) => {
            await e.preventDefault();
            await handleRun();
          }}
          className='flex flex-col p-4 gap-2'>
          <div className='flex flex-col bg-white py-3 px-3 gap'>
            <div className='grid gap-2'>
              <ItemLabel text='Input GCT file' />
              <FilePond
                required={true}
                files={gctFiles}
                credits={false}
                onupdatefiles={setGctFiles}
                name={"GCT File"}
                labelIdle={'Drag & Drop .GCT file or <span class="filepond--label-action">Browse for Files</span>'}
                allowMultiple={false}
                beforeAddFile={(file) => {
                  // only allow .gct files
                  if (file.fileExtension.toLowerCase() !== 'gct') return false;
                  return true;
                }}
              />
              <ItemLabel text='Gene sets database file' />
              <FilePond
                required={true}
                files={geneSetFiles}
                credits={false}
                onupdatefiles={setGeneSetFiles}
                name={"Gene Set Database File"}
                labelIdle={'Drag & Drop Gene Set Database file or <span class="filepond--label-action">Browse for Files</span>'}
                allowMultiple={false}
                beforeAddFile={(file) => {
                  if (
                    (file.fileExtension.toLowerCase() !== 'gmx') &&
                    (file.fileExtension.toLowerCase() !== 'gmt') &&
                    (file.fileExtension.toLowerCase() !== 'txt')
                  ) return false;
                  return true;
                }}
              />
            </div>
            {(gctFiles.length > 0) && (geneSetFiles.length > 0) &&
              <ResultsLog reports={reports} func={handleFunc}/>
            }
          </div>
        </form>
      }
    </>
  )
}

export default ssGSEA;