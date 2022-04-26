import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pathGetParent } from '@dbux/common/src/util/pathUtil';
import { pathJoin, pathRelative, pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { readZipFirstEntryText, zipDataToFile } from '@dbux/common-node/src/util/zipUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import { getDbuxManager } from './DbuxManager';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

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
    ...extractApplicationData(application),
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
 * @return {Promise<Application>}
 */
export async function importApplicationFromFile(fpath) {
  let serialized;
  if (fpath.endsWith('.zip')) {
    // unzipAllTo(zipFpath, targetPath);
    serialized = readZipFirstEntryText(fpath);
  }
  else {
    serialized = fs.readFileSync(fpath, 'utf8');
  }

  const { serializedDpData, ...appData } = JSON.parse(serialized);

  const app = await importApplication(appData, [serializedDpData]);

  return app;
}

/**
 * Extract application information. Use with `dp.deserializeJson` to save dp data.
 * @param {Application} application
 */
export function extractApplicationData(application) {
  const { uuid, createdAt, projectName, experimentId, entryPointPath, applicationId } = application;
  const filePathMD5 = crypto.createHash('md5').update(entryPointPath).digest('hex');
  const isBuiltInProject = isApplicationBuiltInProject(application);
  let rootPath;
  if (isBuiltInProject) {
    rootPath = allApplications.projectsRoot;
  }
  else {
    rootPath = pathGetParent(entryPointPath);
    // rootPath = application.getAppCommonAncestorPath();
  }

  const relativeEntryPointPath = pathRelative(rootPath, entryPointPath);
  const data = {
    relativeEntryPointPath,
    filePathMD5,
    createdAt,
    uuid,
    isBuiltInProject,
    projectName,
    experimentId,
    applicationId,
  };

  return data;
}

const applicationEntryPointPathByHash = new Map();

export async function importApplication(appData, allDpData = EmptyArray) {
  const { isBuiltInProject, relativeEntryPointPath, filePathMD5, ...other } = appData;
  let rootPath;
  if (isBuiltInProject) {
    rootPath = allApplications.projectsRoot;
  }
  else {
    if (!applicationEntryPointPathByHash.get(filePathMD5)) {
      const userInput = await askForApplicationRootPath(appData);
      if (!userInput) {
        throw new Error(`Cannot resolve application entry point path without root path.`);
      }

      applicationEntryPointPathByHash.set(filePathMD5, userInput);
    }
    rootPath = applicationEntryPointPathByHash.get(filePathMD5);
  }
  const entryPointPath = pathJoin(rootPath, relativeEntryPointPath);
  const app = allApplications.addApplication({
    entryPointPath, ...other
  });

  for (const dpData of allDpData) {
    await app.dataProvider.deserializeJson(dpData);
  }

  return app;
}

/**
 * @param {Application} app
 */
function isApplicationBuiltInProject(app) {
  return app.entryPointPath.startsWith(allApplications.projectsRoot);
}

async function askForApplicationRootPath(appData) {
  const manager = getDbuxManager();
  // const title = `Please select the common ancestors path for application ${appData.projectName}`;
  const title = `Please select the folder of entry point "${appData.relativeEntryPointPath}"`;
  return await manager.externals.chooseFolder({ title });
}