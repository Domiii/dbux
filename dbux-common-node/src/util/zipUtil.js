import AdmZip from 'adm-zip';

/**
 * 
 * @param {string} data 
 * @param {string} inputFpath 
 * 
 * @see https://www.npmjs.com/package/adm-zip
 */
export function zipDataToFile(inputFpath, zipFpath, data) {
  let zip = new AdmZip();
  zip.addFile(inputFpath, Buffer.from(data));
  zip.writeZip(zipFpath);
}

export function zipFile(inputFpath, zipFpath) {
  let zip = new AdmZip();
  zip.addLocalFile(inputFpath);
  zip.writeZip(zipFpath);
}