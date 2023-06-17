# BCM Pipeline Toolkit

<p align="center">
      <img src="https://img.shields.io/badge/Electron-2B2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9">
      <img src="https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
      <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
</p>

Tools used for Head and Neck Cancer research at Baylor College of Medicine, with a goal of condensing time-consuming manual pipelines of data analysis methods into one click scanning processes.


## Preview

![Animated Preview](https://github.com/rosman83/bcmhnc-toolkit/blob/main/resources/preview.gif)
## Installation

To run the electron application in development mode, clone or download the folder and run:

```bash 
  cd bcmhnc-toolkit
  npm install
  npm run dev
```
    
## Feature Pipelines

### Analysis Pipeline
Input genetic result files from assorted folder and assign groups to obtain combined spreadsheet of statistical tests, adjusted for error. 

Pipeline consists of recursively scanning all input files to support various genetic data folder schemas, asking user to label testing groups. Data is filtered for existing genes based on lookup list, and transformed into linear and log space data. 

Further normalization is carried out in preparation for Benjamini-Hochberg Procedure. Procedure used calculating fold changes and p values for significant genes via a user defined threshold.

### Single-sample Gene Set Enrichment Analysis Pipeline

"variation of the GSEA algorithm that instead of calculating enrichment scores for groups of samples (i.e Control vs Disease) and sets of genes (i.e pathways), it provides a score for each each sample and gene set pair" (Broad Institue of MIT and Harvard)

Module serving as accessible route to private Genepattern server hosted at Baylor, allowing user to carry out a flow of a single-set gene encrichment analysis test on inputted data, possible from the Data Analysis Pipeline.


## Acknowledgements

- [BROAD Institute](https://www.broadinstitute.org/)
- [Baylor College of Medicine HNC](https://bcmhnc.com)
