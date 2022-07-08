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
 * @param {string} fpath 
 * @param {Application} application 
 */
export function exportApplicationToFile(application, fpath) {
  // exportFpath = safePath(exportFpath);
  const isZip = fpath.endsWith('.zip');
  const exportFolder = path.dirname(fpath);
  if (!fs.existsSync(exportFolder)) {
    fs.mkdirSync(exportFolder, { recursive: true });
  }

  fpath = pathResolve(fpath);

  const data = {
    ...extractApplicationData(application),
    serializedDpData: application.dataProvider.serializeJson()
  };
  const serialized = JSON.stringify(data);

  if (isZip) {
    zipDataToFile(fpath, serialized);
  }
  else {
    fs.writeFileSync(fpath, serialized);
  }

  application.filePath = fpath;

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

  const app = await importApplication(fpath, appData, [serializedDpData]);

  return app;
}

/**
 * Extract application information. Use with `dp.deserializeJson` to save dp data.
 * @param {Application} application
 */
export function extractApplicationData(application) {
  const { uuid, createdAt, projectName, experimentId, entryPointPath, applicationId } = application;

  // NOTE: entryPointPath is not a reliable "project folder"
  //    → so we have to use some extra magic to figure out the actual folder
  const filePathMD5 = crypto.createHash('md5').update(entryPointPath).digest('hex');

  const isBuiltInProject = isApplicationBuiltInProject(application);
  const isBuiltInSample = isApplicationBuiltInSample(application);
  let rootPath;
  if (isBuiltInProject) {
    rootPath = allApplications.projectsRoot;
  }
  else if (isBuiltInSample) {
    rootPath = allApplications.samplesRoot;
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
    isBuiltInSample,
    projectName,
    experimentId,
  };

  return data;
}

const applicationEntryPointPathByHash = new Map();

export async function importApplication(fpath, appData, allDpData = EmptyArray) {
  const { isBuiltInProject, isBuiltInSample, relativeEntryPointPath, filePathMD5, ...other } = appData;
  let rootPath;
  if (isBuiltInSample) {
    rootPath = allApplications.samplesRoot;
  }
  else if (isBuiltInProject) {
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
  const application = allApplications.addApplication({
    entryPointPath, ...other
  });

  application.filePath = fpath;

  for (const dpData of allDpData) {
    await application.dataProvider.deserializeJson(dpData);
  }

  return application;
}

/**
 * @param {Application} app
 */
function isApplicationBuiltInProject(app) {
  return app.entryPointPath.startsWith(allApplications.projectsRoot);
}

/**
 * @param {Application} app
 */
function isApplicationBuiltInSample(app) {
  return app.entryPointPath.startsWith(allApplications.samplesRoot);
}

async function askForApplicationRootPath(appData) {
  const manager = getDbuxManager();
  // const title = `Please select the common ancestors path for application ${appData.projectName}`;
  const title = `Please select the folder of entry point "${appData.relativeEntryPointPath}"`;
  return await manager.externals.chooseFolder({ title });
}
