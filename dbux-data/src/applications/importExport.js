import { pathJoin, pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { readZipFirstEntryText, zipDataToFile } from '@dbux/common-node/src/util/zipUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import fs from 'fs';
import path from 'path';
import allApplications from './allApplications';

/** @typedef {import('./Application').default} Application */

/**
 * @param {string} exportFpath 
 * @param {Application} application 
 */
export function exportApplicationToFile(application, exportFpath) {
  // exportFpath = safePath(exportFpath);
  const isZip = exportFpath.endsWith('.zip');
  const exportFolder = path.dirname(exportFpath);
  if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder, { recursive: true });
  }

  exportFpath = pathResolve(exportFpath);

  const data = {
    ...extractApplicationData(application, application.getAppCommonAncestorPath()),
    serializedDpData: application.dataProvider.serializeJson()
  };
  const serialized = JSON.stringify(data);

  if (isZip) {
    zipDataToFile(exportFpath, serialized);
  }
  else {
    fs.writeFileSync(exportFpath, serialized);
  }

  return serialized;
}

/**
 * @return {Application}
 */
export function importApplicationFromFile(fpath, commonAncestorPath) {
  let serialized;
  if (fpath.endsWith('.zip')) {
    // unzipAllTo(zipFpath, targetPath);
    serialized = readZipFirstEntryText(fpath);
  }
  else {
    serialized = fs.readFileSync(fpath, 'utf8');
  }

  const { serializedDpData, ...appData } = JSON.parse(serialized);

  const app = importApplication(appData, commonAncestorPath, [serializedDpData]);

  return app;
}

/**
 * Extract application information. Use with `dp.deserializeJson` to save dp data.
 * @param {Application} application 
 * @param {string} rootPath Root path to locate the absolute entry point path
 */
function extractApplicationData(application, rootPath) {
  const { uuid, createdAt, projectName, experimentId } = application;
  const relativeEntryPointPath = pathRelative(rootPath, application.entryPointPath);
  const data = {
    relativeEntryPointPath,
    createdAt,
    uuid,
    projectName,
    experimentId
  };

  return data;
}

function importApplication(appData, commonAncestorPath, allDpData = EmptyArray) {
  const { relativeEntryPointPath, serializedDpData, ...other } = appData;
  const entryPointPath = pathJoin(commonAncestorPath, relativeEntryPointPath);
  const app = allApplications.addApplication({
    entryPointPath, ...other
  });

  for (const dpData of allDpData) {
    app.dataProvider.deserializeJson(dpData);
  }

  return app;
}
