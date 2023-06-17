import path from "path";
import csv from 'csvtojson';
import fs from "fs"
import padjust from '@stdlib/stats-padjust';
import ttest2 from '@stdlib/stats-ttest2';
import AdmZip from "adm-zip";
import { createArrayCsvStringifier, createObjectCsvStringifier } from "csv-writer";

const ProgressBar = require('electron-progressbar');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const lookup = require('./lookup.json');

export type DataStore = {
  folders: string[];
  master_path: string;
}

const store: DataStore = {
  master_path: '',
  folders: [],
};

const prelim_results = [];
const reports_file_store = [];
const combined_file_store = [];
const linear_file_store = [];
const log2_file_store = [];
const analysis_file_store = [];

async function XPRA(args, mainWindow) {
  const progressBar = new ProgressBar({
    indeterminate: true,
    text: 'Preparing to analyze data...',
    detail: 'Please wait...',
    browserWindow: {
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    },
  });

  await Checker(args.files, args.ext, progressBar);
  await Reader(progressBar);
  await Combine(progressBar);
  await Analysis(args.threshold, args.fdr, args.topGroup, progressBar);
  const file = await Report();
  progressBar.setCompleted();

  return {
    success: true,
    file: file,
  }
}

const Checker = async (files, ext, progressBar) => {
  const scannedFiles = [];
  async function getFormattedEXT() {
    if (ext.toLowerCase() == 'results') return 'genes.results'
    return ext;
  }

  for (const file of files) {
    scannedFiles.push({
      sample_name: file.sample_name,
      sample_header: file.sample_name.replace(`.${await getFormattedEXT()}`, ''),
      sample_path: file.sample_path,
      sample_group: file.sample_group,
    });
  }

  store.folders = scannedFiles;
  progressBar.detail = 'Finished scanning files...';
}

const Reader = async (progressBar) => {
  for (const folderobj of store.folders as any) {
    let folder = folderobj.sample_header;
    const filePath = path.resolve(folderobj.sample_path)
    const cleanedResults = [];
    const jsonArray = await csv({ delimiter: '\t' }).fromFile(filePath);

    for (const result of jsonArray) {
      progressBar.detail = `Filtering ${folderobj.sample_header} based on gene lookup list... (${((jsonArray.indexOf(result) + 1)/(jsonArray.length) * 100).toFixed(0)}%)`;
      const gene_id = result.gene_id;
      const reference = lookup.find(item => item.gene_id == gene_id);
      if (reference) {
        result.gene_name = reference["gene name"];
        result.symbol = reference.symbol;
        cleanedResults.push(result)
      }
    }

    progressBar.detail = `Saving filtered version of ${folderobj.sample_header}...`;

    const csvWriter = createObjectCsvStringifier({
      header: [
        { id: 'gene_id', title: 'gene_id' },
        { id: 'gene_name', title: 'gene_name' },
        { id: 'symbol', title: 'symbol' },
        { id: 'transcript_id(s)', title: 'transcript_id(s)' },
        { id: 'length', title: 'length' },
        { id: 'effective_length', title: 'effective_length' },
        { id: 'expected_count', title: 'expected_count' },
        { id: 'TPM', title: 'TPM' },
        { id: 'FPKM', title: 'FPKM' },
      ]
    });

    // NEW AREA
    prelim_results.push({
      folder: folder,
      csv_string: csvWriter.getHeaderString() + '\t' +csvWriter.stringifyRecords(cleanedResults)
    })

  }
}

const Combine = async (progressBar) => {
  progressBar.detail = 'Setting file paths for thresholded testing...';
  let filteredArray = [];
  let reportedgenes = [];
  const headers = [];
  const linearArray = [];
  const log2Array = [];
  const combinedArray = [];

  for (const folderobj of store.folders as any) {
    let folder = folderobj.sample_header;
    headers.push({ id: folder, title: folder })
  }
  const linearWriter = createObjectCsvStringifier({
    header: [
      { id: 'gene_id', title: 'gene_id' },
      { id: 'gene_name', title: 'gene_name' },
      { id: 'symbol', title: 'symbol' },
      ...headers
    ]
  });
  const log2Writer = createObjectCsvStringifier({
    header: [
      { id: 'gene_id', title: 'gene_id' },
      { id: 'gene_name', title: 'gene_name' },
      { id: 'symbol', title: 'symbol' },
      ...headers
    ]
  });
  const modifiedLog2Headers = headers.map((header) => {
    return { id: header.id + '_log2', title: header.id + '_log2' }
  })
  const combinedWriter = createObjectCsvStringifier({
    header: [
      { id: 'gene_id', title: 'gene_id' },
      { id: 'gene_name', title: 'gene_name' },
      { id: 'symbol', title: 'symbol' },
      //  Using Log 2 values for future tests, not linear space
      ...modifiedLog2Headers
    ]
  });
  for (const folderobj of store.folders as any) {
    let folder = folderobj.sample_header;
    const preParsedArray = await csv({}).fromString(
      prelim_results.find((item) => item.folder == folderobj.sample_header).csv_string
    )
    const parsedArray = preParsedArray.filter((item) => (Number(item.effective_length) !== 0))
    filteredArray = preParsedArray.filter((item) => Number(item.effective_length) == 0);
    if (filteredArray.length > 0) {
      for (const item of filteredArray) {
        item.source_file = folderobj.sample_header;
        reportedgenes.push(item);
      }
    }
    progressBar.detail = 'Normalizing ' + folderobj.sample_header + `... (${store.folders.indexOf(folderobj) + 1}/${store.folders.length})`;
    // Get the %75th percentile of the expected_count column
    const expectedCountArray = parsedArray.filter((item) => (Number(item.expected_count) !== 0)).map((item) => item.expected_count);
    const expectedCountArrayFiltered = expectedCountArray.filter(item => item !== null);
    const expectedCountArraySorted = expectedCountArrayFiltered.sort((a, b) => a - b);
    const expectedCountArrayLength = expectedCountArraySorted.length;
    const expectedCountArrayIndex = Math.floor(expectedCountArrayLength * 0.75);
    const expectedCountArrayPercentile = expectedCountArraySorted[expectedCountArrayIndex];

    // Loop through each row in the CSV
    for (const row of parsedArray) {
      // Between sample normalization
      const linearFPKM = ((row.expected_count / row.effective_length) / expectedCountArrayPercentile) * 1000000;
      const log2FPKM = Math.log2(linearFPKM + 0.01);

      // Check if the gene_id already exists in the linearArray
      const linearIndex = linearArray.findIndex(item => item.gene_id === row.gene_id);
      // If the gene_id does not exist in the first array, add it to both
      if (linearIndex === -1) {
        // Create a new object with the gene_id, gene_name, and symbol
        const newObject = {
          gene_id: row.gene_id,
          gene_name: row.gene_name,
          symbol: row.symbol,
          [folder]: linearFPKM,
        }
        linearArray.push(newObject);
        const newObject2 = {
          gene_id: row.gene_id,
          gene_name: row.gene_name,
          symbol: row.symbol,
          [folder]: log2FPKM
        }
        log2Array.push(newObject2);
        const newObject3 = {
          gene_id: row.gene_id,
          gene_name: row.gene_name,
          symbol: row.symbol,
          // [folder + '_linear']: linearFPKM,
          [folder + '_log2']: log2FPKM
        }
        combinedArray.push(newObject3);
      } else {
        // Add the FPKM value to the correct column in the linearArray
        linearArray[linearIndex][folder] = linearFPKM;
        log2Array[linearIndex][folder] = log2FPKM;
        // combinedArray[linearIndex][folder + '_linear'] = linearFPKM;
        combinedArray[linearIndex][folder + '_log2'] = log2FPKM;
      }
    }
    // Sort CSV by symbol column alphabetically
    linearArray.sort((a, b) => (a.symbol > b.symbol) ? 1 : -1);
    log2Array.sort((a, b) => (a.symbol > b.symbol) ? 1 : -1);
    combinedArray.sort((a, b) => (a.symbol > b.symbol) ? 1 : -1);
  }

  const reportWriter = await createObjectCsvStringifier({
    header: [
      { id: 'source_file', title: 'source_file' },
      { id: 'gene_id', title: 'gene_id' },
      { id: 'gene_name', title: 'gene_name' },
      { id: 'symbol', title: 'symbol' },
      { id: 'length', title: 'length' },
      { id: 'effective_length', title: 'effective_length' },
      { id: 'expected_count', title: 'expected_count' },
      { id: 'FPKM', title: 'FPKM' }
    ]
  });

  reports_file_store.push({ csv_string: await reportWriter.getHeaderString() + '\t' +await reportWriter.stringifyRecords(reportedgenes) });
  linear_file_store.push({ csv_string: await linearWriter.getHeaderString() + '\t' +await linearWriter.stringifyRecords(linearArray) });
  log2_file_store.push({ csv_string: await log2Writer.getHeaderString() + '\t' +await log2Writer.stringifyRecords(log2Array) });
  combined_file_store.push({ csv_string: await combinedWriter.getHeaderString() + '\t' + await combinedWriter.stringifyRecords(combinedArray) });
}

const Analysis = async (threshold, fdr, topGroup, progressBar) => {
  const bothCombinedArray = await csv({}).fromString(
    combined_file_store[0].csv_string
  )
  // Create an array of objects that sorts each object from the store into a subarray of objects using it's sample_group
  const sampleGroups = store.folders.reduce((acc, obj: any) => {
    const key = obj.sample_group;
    if (!acc[key]) acc[key] = [];
    acc[key].push(obj);
    return acc;
  }, {});
  // Get amount of objects in sampleGroups
  const sampleGroupAmount = Object.keys(sampleGroups).length;

  if (sampleGroupAmount == 2) {
    // Create a new CSV
    const csvWriter = await createObjectCsvStringifier({
      header: [
        { id: 'gene_id', title: 'gene_id' },
        { id: 'gene_name', title: 'gene_name' },
        { id: 'symbol', title: 'symbol' },
        { id: 'fold_change', title: 'fold_change' },
        { id: 'p_value', title: 'p_value' },
        { id: 'adjusted_p_value', title: 'adjusted_p_value' },
        { id: 'significant', title: 'significant' },
      ]
    });

    let sampleGroup1 = await sampleGroups[Object.keys(sampleGroups).find(key => key == topGroup)]
    let sampleGroup2 = await sampleGroups[Object.keys(sampleGroups).find(key => key !== topGroup)]

    // Loop over each gene in the bothCombinedArray
    const AnalyzedObjectsArray = []
    let ObjectsRemoved = 0
    for (const gene of bothCombinedArray) {
      progressBar.detail = `Testing gene ${gene.gene_id} with threshold of ${threshold}` + `... (${((bothCombinedArray.indexOf(gene) + 1) / bothCombinedArray.length * 100).toFixed(0)}%)`
    
      // Create an array getting the values from gene in the column with the same name as the sample_group
      // Iteratate over sampleGroup1
      const sampleGroup1Values = []
      for (const sample of sampleGroup1) {
        await sampleGroup1Values.push(Number(gene[`${sample.sample_header}_log2`]))
      }
      // Iteratate over sampleGroup2
      const sampleGroup2Values = []
      for (const sample of sampleGroup2) {
        await sampleGroup2Values.push(Number(gene[`${sample.sample_header}_log2`]))
      }
      // Take average of each group and if one of the groups is equal to or greater than the threshold, then continue, otherwise skip gene
      const sampleGroup1Average = await sampleGroup1Values.reduce((a, b) => a + b, 0) / sampleGroup1Values.length;
      const sampleGroup2Average = await sampleGroup2Values.reduce((a, b) => a + b, 0) / sampleGroup2Values.length;
      if (sampleGroup1Average < threshold && sampleGroup2Average < threshold) {
        ObjectsRemoved++
        continue;
      }
      const test = await ttest2(sampleGroup1Values, sampleGroup2Values, {
        variance: 'equal',
      }).pValue;
      // - To get geo mean you take average in log space (normalized values), then take inverse 2 log of that - and that is geo mean (2^(A_B))
      // fold change is two to the power of (sample group 1 - sample group 2)
      const tempFoldChange = Math.pow(2, (sampleGroup1Average - sampleGroup2Average))
      const finalFoldChange = tempFoldChange < 1 ? -1 / tempFoldChange : tempFoldChange
      // if either the Geomean A, B, or fold change are NaN, retuirn error
      if (isNaN(finalFoldChange)) {
        throw new Error('One of the values in the analysis was NaN. Please try again.')
      }

      await AnalyzedObjectsArray.push({
        gene_id: gene.gene_id,
        gene_name: gene.gene_name,
        symbol: gene.symbol,
        fold_change: Number(finalFoldChange),
        p_value: Number(test),
        adjusted_p_value: null,
        significant: null
      })
    }

    progressBar.detail = `Calculating adjusted p values using Benjamini-Hochberg Procedure...`
    const pValuesArray = await AnalyzedObjectsArray.map((obj: any) => obj.p_value)
    const adjustedPValues = await padjust(pValuesArray, 'bh');
    for (let i = 0; i < AnalyzedObjectsArray.length; i++) {
      AnalyzedObjectsArray[i].adjusted_p_value = adjustedPValues[i];
    }
    for (let i = 0; i < AnalyzedObjectsArray.length; i++) {
      if (AnalyzedObjectsArray[i].adjusted_p_value < fdr) {
        AnalyzedObjectsArray[i].significant = 1;
      } else {
        AnalyzedObjectsArray[i].significant = 0;
      }
    }
    // Sort sheet by lowest adjusted p value
    AnalyzedObjectsArray.sort((a: any, b: any) => {
      return a.adjusted_p_value - b.adjusted_p_value;
    })

    // Write the new CSV
    analysis_file_store.push({
      csv_string: await csvWriter.getHeaderString() + '\t' + await csvWriter.stringifyRecords(AnalyzedObjectsArray),
    })
  } else {
    throw new Error('Test type currently unsupported for more than two groups. Please try again with two groups.')
  }
}

const Report = async () => {
  // TODO: Prepare expression profile for ssGSEA based on linear results

  // Load linear_combined results into memory
  const linearCombined = await csv({}).fromString(linear_file_store[0].csv_string)
  const geneCount = linearCombined.length;
   
  /*   
  // GCT WORK START

  // Create a CSV with a master column in A1 with "#1.2"
  const GCTAnalysisPath = await path.resolve(__dirname, `results/final/analysis.gct`)
  const folderscnt = await store.folders.map((folder: any) => folder.sample_header)
  const csvContent = `#1.2\n${geneCount},${folderscnt.length}\nName,Description,${folderscnt.join(',')}`;
  const csvBuffer = Buffer.from(csvContent, 'utf8');

  // Loop over each gene in the linearCombined array and push an object to the GCTAnalysisArray with the format [symbol, symbol, allSampleValues] where AllSampleValues is an array of all the values for that gene in the same order as the folderscnt array
  const GCTAnalysisArray = []
  for (const gene of linearCombined) {
    const allSampleValues = []
    for (const folder of folderscnt) {
      await allSampleValues.push(Number(gene[folder]))
    }
    await GCTAnalysisArray.push([gene.symbol, gene.symbol, ...allSampleValues])
  }

  await fs.writeFileSync(GCTAnalysisPath, csvBuffer, { flag: 'w' });
  await fs.appendFileSync(GCTAnalysisPath, '\n');

  // Append GTCAnalysisArray to the CSVBuffer and write to the GCTAnalysisPath

  for (const gene of GCTAnalysisArray) {
    await fs.appendFileSync(GCTAnalysisPath, gene.join(','));
    await fs.appendFileSync(GCTAnalysisPath, '\n');
  } */




  const zip = new AdmZip();
  
  // load analysis_file_store[0].csv_string and reports_file_store[0].csv.string as seperate csv's
  await csv({
  }).fromString(analysis_file_store[0].csv_string)

  await csv({
  }).fromString(reports_file_store[0].csv_string)

  zip.addFile("analysis.csv", Buffer.alloc(analysis_file_store[0].csv_string.length, analysis_file_store[0].csv_string), "analysis.csv");
  zip.addFile("reports.csv", Buffer.alloc(reports_file_store[0].csv_string.length, reports_file_store[0].csv_string), "reports.csv");

  const final_file = await zip.toBuffer()
  return final_file;
}

export default XPRA;