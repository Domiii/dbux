import { _require } from '@dbux/common/src/util/universalLibs';

/**
 * 
 * @param {string} data 
 * @param {string} inputFpath 
 * 
 * @see https://www.npmjs.com/package/adm-zip
 */
export function zipDataToFile(inputFpath, zipFpath, data) {
  const AdmZip = _require('adm-zip');

  let zip = new AdmZip();
  zip.addFile(inputFpath, Buffer.from(data));
  zip.writeZip(zipFpath);
}

export function zipFile(inputFpath, zipFpath) {
  const AdmZip = _require('adm-zip');
  
  let zip = new AdmZip();
  zip.addLocalFile(inputFpath);
  zip.writeZip(zipFpath);
}