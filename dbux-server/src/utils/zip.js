
import AdmZip from 'adm-zip';

/**
 * 
 * @param {string} data 
 * @param {string} filename 
 */
export function zipToFile(data, filename, zipFilename) {
  let zip = new AdmZip();
  zip.addFile(filename, Buffer.from(data));
  zip.writeZip(zipFilename);
}