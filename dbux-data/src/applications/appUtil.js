import { pathJoin, pathNormalized, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { readZipFirstEntryText, zipDataToFile } from '@dbux/common-node/src/util/zipUtil';
import fs from 'fs';
import path from 'path';
import allApplications from './allApplications';
import Application from './Application';



/**
 * @param {string} exportFpath 
 * @param {Application} application 
 */
export async function exportApplication(application, exportFpath) {
  // exportFpath = safePath(exportFpath);
  const isZip = exportFpath.endsWith('.zip');
  const exportFolder = path.dirname(exportFpath);
  if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder, { recursive: true });
  }

  exportFpath = pathResolve(exportFpath);

  // make data
  const { uuid, createdAt } = application;
  const relativeEntryPointPath = application.getRelativeEntryPoint();
  const data = {
    relativeEntryPointPath,
    createdAt,
    uuid,
    serializedDpData: application.dataProvider.serializeJson()
  };
  const serialized = JSON.stringify(data);

  if (isZip) {
    zipDataToFile(exportFpath, serialized);
  }
  else {
    fs.writeFileSync(exportFpath, serialized);
  }
}

/**
 * @return {Application}
 */
export function importApplication(fpath) {
  let serialized;
  if (fpath.endsWith('.zip')) {
    // unzipAllTo(zipFpath, targetPath);
    serialized = readZipFirstEntryText(fpath);
  }
  else {
    serialized = fs.readFileSync(fpath, 'utf8');
  }

  const appData = JSON.parse(serialized);
  const { relativeEntryPointPath, createdAt, uuid, serializedDpData } = appData;
  const { appRoot } = allApplications;
  const entryPointPath = pathJoin(appRoot, relativeEntryPointPath);
  const app = allApplications.addApplication({ entryPointPath, createdAt, uuid });
  app.dataProvider.deserializeJson(serializedDpData);
}