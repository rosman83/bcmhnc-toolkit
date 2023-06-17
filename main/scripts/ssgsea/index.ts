import axios from 'axios';
import { nanoid } from 'nanoid'
import fs from 'fs';
// @TODO - Add Username and Password validation checking before using ssgsea module

async function authorizationHeader() {
  let username = "sipera3417";
  let password = "596Ju%sh@R^Y";
  const base64Encoded = Buffer.from(username + ':' + password, 'ascii').toString('base64');
  const result = 'Basic ' + base64Encoded;
  return result;
}

async function SSGSEA(args) {
  const server_url = 'https://cloud.genepattern.org/gp';

  // append each file in the args.gctFile array to the formData object using a for loop
  const gctFileInputs = [];
  for (let i = 0; i < args.gctFile.length; i++) {
    const file = args.gctFile[i];
    const gctFile = fs.readFileSync(file);
    const filename = nanoid() + '.gct';

    const response = await axios({
      method: 'POST',
      url: 'https://cloud.genepattern.org/gp/rest/v1/data/upload/job_input',
      params: { name: filename },
      headers: {
        Accept: '*/*',
        'User-Agent': 'GenePatternRest',
        'Content-Type': 'text/plain',
        Authorization: await authorizationHeader()
      },
      data: gctFile
    });

    gctFileInputs.push(response.data)
  }

  // Upload each file path in the array of args.geneSetFile to the server
  const dbFileInputs = [];
  for (let i = 0; i < args.geneSetFile.length; i++) {
    const file = args.geneSetFile[i];
    const gctFile = fs.readFileSync(file);
    const filename = nanoid() + '.' + file.split('.').pop();;

    const response = await axios({
      method: 'POST',
      url: 'https://cloud.genepattern.org/gp/rest/v1/data/upload/job_input',
      params: { name: filename },
      headers: {
        Accept: '*/*',
        'User-Agent': 'GenePatternRest',
        'Content-Type': 'text/plain',
        Authorization: await authorizationHeader()
      },
      data: gctFile
    });

    dbFileInputs.push(response.data)
  }

  // Run ssGSEA using files from previous steps

  const ssGSEAjob = {
    // name of ssGSEA module code
    lsid: 'urn:lsid:broad.mit.edu:cancer.software.genepattern.module.analysis:00270:10.1.0',
    params: [
      {
        name: 'input.gct.file',
        values: gctFileInputs
      },
      { name: 'output.file.prefix', values: [''] },
      {
        name: 'gene.sets.database.files',
        values: dbFileInputs
      },
      { name: 'gene.symbol.column', values: ['Name'] },
      { name: 'gene.set.selection', values: ['ALL'] },
      { name: 'sample.normalization.method', values: ['log'] },
      { name: 'weighting.exponent', values: ['0.75'] },
      { name: 'min.gene.set.size', values: ['10'] },
      { name: 'combine.mode', values: ['combine.off'] }
    ]
  };

  const ssGSEAoptions = {
    method: 'POST',
    url: 'https://cloud.genepattern.org/gp/rest/v1/jobs',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'User-Agent': 'GenePatternRest',
      Authorization: await authorizationHeader()
    },
    data: ssGSEAjob
  };

  const ssGSEAresponse = await axios(ssGSEAoptions);

  // Poll the server for the status of the job
  const jobId = ssGSEAresponse.data.jobId;
  const jobStatusOptions = {
    method: 'GET',
    url: `https://cloud.genepattern.org/gp/rest/v1/jobs/${jobId}`,
    headers: {
      Accept: '*/*',
      'User-Agent': 'GenePatternRest',
      Authorization: await authorizationHeader()
    }
  };

  let jobStatusResponse = await axios(jobStatusOptions);
  let jobStatus = jobStatusResponse.data.status;

  while (jobStatus.isFinished === false) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    jobStatusResponse = await axios(jobStatusOptions);
    jobStatus = jobStatusResponse.data.status;
  }

  if (jobStatus.isError === true) {
    return { sucesss: false, error: jobStatus.errorMessage };
  }

  // Axios download file and return the file
  const downloadFileOptions = {
    method: 'GET',
    url: jobStatusResponse.data.outputFiles[0].link.href,
    headers: {
      'User-Agent': 'GenePatternRest',
      Authorization: await authorizationHeader()
    }
  };

  const downloadFileResponse = await axios(downloadFileOptions);
  const downloadFile = downloadFileResponse.data;
  return { success: true, file: downloadFile };
}

export default SSGSEA;