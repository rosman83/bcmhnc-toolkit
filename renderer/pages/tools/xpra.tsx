import { ipcRenderer } from 'electron';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import Loading from "../../components/loading";

import { ResultsLog } from "../../components/results";
import { useRecoilState } from "recoil";
import { XPRA_ext, XPRA_fdr, XPRA_files, XPRA_loading, XPRA_reports, XPRA_threshold, XPRA_topGroup, XPRA_uniqueGroups } from "../../state/store";
// Migrate to https://github.com/rpldy/react-uploady to prepare for production? 
// TODO: Fix the akward typing into the input boxes state management error also caused by this...

function XPRA() {
  // State for directory path
  const [loading, setLoading] = useRecoilState(XPRA_loading);
  const [files, setFiles] = useRecoilState(XPRA_files);
  const [threshold, setThreshold] = useRecoilState(XPRA_threshold);
  const [fdr, setFDR] = useRecoilState(XPRA_fdr);
  const [uniqueGroups, setUniqueGroups] = useRecoilState(XPRA_uniqueGroups);
  const [topGroup, setTopGroup] = useRecoilState(XPRA_topGroup)
  const [ext, setExt] = useRecoilState(XPRA_ext);
  const [reports, setReports] = useRecoilState(XPRA_reports);

  const handleRun = async () => {

    await ipcRenderer.send('xpra-message', {
      files: files.map((file) => {
        return {
          'sample_name': file.file.name,
          'sample_path': file.file.path,
          'sample_group': file.file.sample_group
        };
      }),
      ext: ext,
      threshold: threshold,
      fdr: fdr,
      topGroup: topGroup
    });

    setLoading(true);

    ipcRenderer.once('xpra-reply', (event, arg) => {
      const newReport = {
        time: new Date(),
        success: arg.success,
      }
      setReports([...reports, newReport]);
      setLoading(false);

      if (!arg.success) return alert(arg.error);
      
      return ipcRenderer.send('save-file', {
        title: 'Save XPRA Report',
        defaultPath: 'report.zip',
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] },
        ],
        content: arg.file,
      });
      
    });
  }

  const Setting = function (props) {
    if (props.decimal) {
      return (
        <div className='pl-4 gap-3 flex flex-row items-center pt-3'>
          <label className='font-xs'>{props.label}:</label>
          <input required value={props.val} onChange={
            (e) => {
              if (Number(e.target.value) > 1) {
                e.target.value = "1";
              }
              if (Number(e.target.value) < 0) {
                e.target.value = "0";
              }

              props.set(e.target.value);
            }}
            type='number' className='p-2 bg-gray-100 rounded-md' />
        </div>
      )
    }

    if (props.number) {
      return (
        <div className='pl-4 gap-3 flex flex-row items-center pt-3'>
          <label className='font-xs'>{props.label}:</label>
          <input required onChange={
            (e) => {
              if (Number(e.target.value) < 0) {
                e.target.value = "0";
              }

              props.set(e.target.value);
            }
          } value={props.val} type='number' className='p-2 bg-gray-100 rounded-md' />
        </div>
      )
    }

    if (props.file) {
      return (
        <div className='pl-4 gap-3 flex flex-row items-center pt-3'>
          <label className='font-xs'>{props.label}:</label>
          <select required value={props.val} onChange={(e) => {
            setFiles([]);
            props.set(e.target.value);
          }}
            className='p-2 bg-gray-100 rounded-md'>
            {props.options.map((option, i) => (
              <option key={i} value={option.toLowerCase()}>{option}</option>
            ))}
          </select>
        </div>
      )
    }

    if (props.top) {
      if ((topGroup == "" || topGroup == undefined || topGroup == null) && uniqueGroups.length > 0) {
        setTopGroup(uniqueGroups[0]);
      }

      return (
        <div className='pl-4 gap-3 flex flex-row items-center pt-3'>
          <label className='font-xs'>{props.label}:</label>
          <select required value={props.val} onChange={(e) => {
            props.set(e.target.value);
          }}
            className='p-2 bg-gray-100 rounded-md'>
            {(props.options.map((option, i) => (
              <option key={i} value={option}>{option}</option>
            )))}
          </select>
        </div>
      )
    }

    if (props.group) {
      // Create onchange function to set value of group as value for file.file.group
      return (
        <div className='pl-4 gap-3 flex flex-row items-center pt-3'>
          <label className='font-xs'>{props.label}:</label>
          <input required type='text' className='p-2 bg-gray-100 rounded-md'
            onChange={(e) => {
              let newFiles = files;
              newFiles.filter((file) => {
                return file.file.name === props.label;
              })[0].file.sample_group = e.target.value;
              setFiles(newFiles);

              // also set unique groups seperately in the groups array state
              //create filtered array of unique groups
              let unique = [];
              newFiles.forEach((file) => {
                if (!unique.includes(file.file.sample_group) && file.file.sample_group !== "" && file.file.sample_group !== undefined) {
                  unique.push(file.file.sample_group);
                }
              }
              );
              setUniqueGroups(unique);

            }}
            value={(files.filter((file) => {
              return file.file.name === props.label;
            })[0] || { file: { sample_group: "" } }).file.sample_group}
          />
        </div>
      )
    }
  }

  const handleFunc = async (report) => {
    setReports(reports.splice(reports.indexOf(report), 1));
  }

  return (
    <>
      {loading ? <Loading /> :
        <form
          onSubmit={async (e) => {
            await e.preventDefault();
            await handleRun();
          }}
          className='flex flex-col p-4 gap-2'>
          <div className='flex flex-col bg-white py-3 px-3 gap-5'>
            <Setting file={true} label='File Format' val={ext} set={setExt} options={['RESULTS', 'CSV']} />
            <div className='grid gap-2'>
              <FilePond
                required={true}
                files={files}
                credits={false}
                onupdatefiles={setFiles}
                name={"Gene Data Folder"}
                labelIdle={'Drag & Drop folder or <span class="filepond--label-action">Browse for Files</span>'}
                allowDirectoriesOnly={true}
                allowMultiple={true}
                beforeAddFile={(file) => {
                  if (file.fileExtension.toLowerCase() !== ext.toLowerCase()) {
                    return false;
                  }
                  // To ignore isoform junk files
                  if (file.filename.toLowerCase().includes(".isoforms")) {
                    return false;
                  }
                  return true;
                }}
                itemInsertLocation={(a, b) => {
                  // If no file data yet, treat as equal
                  if (!(a.file && b.file)) return 0;

                  // sort alphabetically by file name
                  if (a.file.name < b.file.name) {
                    return -1;
                  } else if (a.file.name > b.file.name) {
                    return 1;
                  }

                  return 0;
                }}
              />
            </div>
          </div>
          {files.length > 0 &&
            <div className='flex flex-row bg-white pb-4 px-3 gap-3 py-4'>
              <div className='py-3 px-4 rounded-lg  w-full flex flex-col gap-5'>
                <a className='font-semibold'>Input group number or letter for samples</a>
                <div className='grid grid-cols-2 gap-3'>
                  {files.map((file, i) => (
                    <Setting key={i} group={true} label={file.file.name} />
                  ))}
                </div>
                <div className='flex flex-row bg-white pt-1 pb-4 gap-3'>
                  <Setting options={uniqueGroups} top={true} val={topGroup} set={setTopGroup} label='Select top group for fold change calculation' />
                </div>
              </div>
            </div>
          }
          {files.length > 0 &&
            <div className='flex flex-row bg-white pt-1 pb-4 px-3 gap-3'>
              <Setting val={threshold} set={setThreshold} number={true} label='Threshold' />
              <Setting val={fdr} set={setFDR} decimal={true} label='False Discovery Rate' />
            </div>
          }
          {files.length > 0 &&
            <ResultsLog
              reports={reports}
              func={handleFunc}
            />
          }
        </form>
      }
    </>
  )
}

export default XPRA;