import settings from 'electron-settings';

async function InitSettings() {
  const genepattern_exists = await settings.has('genepattern')
  if (!genepattern_exists) {
    await settings.set('genepattern', {
      url: 'https://cloud.genepattern.org/gp',
      username: 'sipera3417',
      password: '596Ju%sh@R^Y'
    });
  }

  const ssgsea_exists = await settings.has('ssgsea')
  if (!ssgsea_exists) {
    await settings.set('ssgsea', {
      sample_normalization_method: 'log',
      weighting_exponent: '0.75',
      min_gene_set_size: '10',
      combine_mode: 'combine.off'
    })
  }
}

export default InitSettings;
 