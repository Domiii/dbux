import { newLogger } from '@dbux/common/src/log/logger';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { existsSync, realpathSync } from 'fs';
import { getCodeDirectory, getLogsDirectory } from '../codeUtil/codePath';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Research');

/** ###########################################################################
 * Constant config
 *  #########################################################################*/

const DataFolderLinkName = 'dataFolder.lnk';

/** ###########################################################################
 * files + folders
 *  #########################################################################*/

let dataFolder;

export function lookupDataRootFolder() {
  const linkPath = pathResolve(getCodeDirectory(), DataFolderLinkName);
  if (existsSync(linkPath)) {
    dataFolder = realpathSync(linkPath);
    debug(`Data folder link found: ${dataFolder}`);
  }
  else {
    dataFolder = getLogsDirectory();
    debug(`No data folder link found.`);
  }
  return dataFolder;
}

export function getDataFolder(researchProjectName, forceLookup = false) {
  if (!researchProjectName) {
    throw new Error('researchProjectName missing');
  }

  if (forceLookup || !dataFolder) {
    lookupDataRootFolder();
  }
  return pathResolve(dataFolder, researchProjectName);
}