import { newLogger } from '@dbux/common/src/log/logger';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { existsSync, realpathSync } from 'fs';
import { getCodeDirectory, getLogsDirectory } from '../codeUtil/codePath';
import { exportApplication } from '@dbux/data/src/applications/appUtil';
import { getFileSizeSync } from '@dbux/common-node/src/util/fileUtil';
import { showInformationMessage } from 'src/codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Research');

/** ###########################################################################
 * Constant config
 *  #########################################################################*/

/**
 * WARNING: "research projects" are entirely different from dbux-project projects!
 * Usually, all dbux-projects could contribute data to a single research project
 */
const CurrentResearchProjectName = 'async-js'; // TODO: make this configurable
const DataFolderLinkName = 'dataFolder.lnk';
const AppDataZipFileNameSuffix = '.dbuxapp.zip';

export function getDataFolderLink() {
  return pathResolve(getCodeDirectory(), DataFolderLinkName);
}

/** ###########################################################################
 * folders
 * ##########################################################################*/

export function getAllResearchFolders() {
  return [this.projectDataFolder, this.projectDataFolderLfs];
}

export function getProjectDataRoot(projectName) {
  return pathResolve(getResearchDataRoot(), projectName);
}

export function getProjectDataFolderLfs() {
  return pathResolve(getResearchDataRoot(), 'lfs');
}

/**
 * @return The given app's zip file path, stored for the CurrentResearchProject
 */
export function getAppZipFilePath(appLike) {
  const { projectName } = appLike;
  if (!projectName) {
    return null;
  }
  return pathResolve(this.projectDataFolderLfs, projectName + AppDataZipFileNameSuffix);
}

/** ###########################################################################
 * link folder
 *  #########################################################################*/

let researchRootFolder;

export function lookupDataRootFolder() {
  const linkPath = getDataFolderLink();
  if (existsSync(linkPath)) {
    researchRootFolder = realpathSync(linkPath);
    debug(`Data folder link found: ${researchRootFolder}`);
  }
  else {
    // dataFolder = getLogsDirectory();
    researchRootFolder = null;
    debug(`No data folder link found.`);
  }
  return researchRootFolder;
}

export function getResearchDataRoot(forceLookup = false) {
  if (!CurrentResearchProjectName) {
    throw new Error('CurrentResearchProject missing');
  }

  if (forceLookup || !researchRootFolder) {
    lookupDataRootFolder();
  }
  return pathResolve(researchRootFolder, CurrentResearchProjectName);
}

/** ###########################################################################
 * data import + export
 *  #########################################################################*/

export function exportResearchAppData(app) {
  // WARNING: if any of these functions are changed to async, make sure to properly handle all possible race conditions.
  const zipFpath = getAppZipFilePath(app);

  // write zipped backup
  exportApplication(app, zipFpath);

  // const origSize = getUnzippedSize() / 1024 / 1024;
  //  (from ${origSize.toFixed(2)}MB)
  const zipSize = getFileSizeSync(zipFpath) / 1024 / 1024;
  const msg = `Research application data zipped: ${zipSize.toFixed(2)}MB at "${zipFpath}".`;
  showInformationMessage(msg);
}

export function importResearchAppData(appProjectName) {
  const zipFpath = getAppZipFilePath({ projectName: appProjectName });
  // TODO: research apps are by bug, not by project
}