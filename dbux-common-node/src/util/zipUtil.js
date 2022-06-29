import requireDynamic from '@dbux/common/src/util/requireDynamic';

/** ###########################################################################
 * write
 * ##########################################################################*/


/**
 * 
 * @param {string} data 
 * @param {string} entryName 
 * 
 * @see https://www.npmjs.com/package/adm-zip
 */
export function zipDataToFile(zipFpath, data, entryName = 'first-entry') {
  const AdmZip = requireDynamic('adm-zip');

  let zip = new AdmZip();
  zip.addFile(entryName, Buffer.from(data));
  zip.writeZip(zipFpath);
}

export function zipFile(inputFpath, zipFpath) {
  const AdmZip = requireDynamic('adm-zip');
  
  let zip = new AdmZip();
  zip.addLocalFile(inputFpath);
  zip.writeZip(zipFpath);
}

/** ###########################################################################
 * read
 * ##########################################################################*/

export function getZipFirstEntry(zip) {
  return zip.getEntries()[0];
}

export function getZipFirstEntryName(zip) {
  return zip.getEntries()[0]?.entryName;
}

export function readZipFirstEntryText(zipFpath) {
  const AdmZip = requireDynamic('adm-zip');

  let zip = new AdmZip(zipFpath);
  const firstEntry = getZipFirstEntryName(zip);
  return zip.readAsText(firstEntry);
}

export function unzipAllTo(zipFpath, targetPath, overwrite = true) {
  const AdmZip = requireDynamic('adm-zip');

  let zip = new AdmZip(zipFpath);
  zip.extractAllTo(targetPath, overwrite);
}