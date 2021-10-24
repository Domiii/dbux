import { newLogger } from '@dbux/common/src/log/logger';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { getPrettyPerformanceDelta } from '@dbux/common-node/src/util/timeUtil';
import { existsSync, readdirSync, realpathSync } from 'fs';
import { exportApplication, importApplication } from '@dbux/data/src/applications/appUtil';
import { getFileSizeSync } from '@dbux/common-node/src/util/fileUtil';
import { performance } from 'perf_hooks';
import { getCodeDirectory } from '../codeUtil/codePath';
import { showInformationMessage } from '../codeUtil/codeModals';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Research');

/** ###########################################################################
 * Constant config
 *  #########################################################################*/

/**
 * Usually, all dbux-projects could contribute data to a single research
 */
const CurrentResearchName = 'async-js'; // TODO: make this configurable
const DataFolderLinkName = 'dataFolder.lnk';
const AppDataZipFileNameSuffix = '.dbuxapp.zip';

export function getDataFolderLink() {
  return pathResolve(getCodeDirectory(), DataFolderLinkName);
}

/** ###########################################################################
 * {@link Research} class
 * ##########################################################################*/

/**
 * future-work: move all data that depends on research name in here
 *    -> and move most of this to dbux-data.
 */
export class Research {
  name;
  ;

  constructor(name) {
    this.name = name;
  }


  /** ###########################################################################
   * folders
   * ##########################################################################*/

  getResearchDataRoot(forceLookup = false) {
    const researchName = this.name;
    if (!researchName) {
      throw new Error('CurrentResearchProject missing');
    }

    if (forceLookup || !this._researchRootFolder) {
      this.lookupDataRootFolder();
    }
    return pathResolve(this._researchRootFolder, CurrentResearchName);
  }

  getAllResearchFolders() {
    return [this.getExperimentRoot(), this.getDataRootLfs()];
  }

  getExperimentRoot() {
    return pathResolve(this.getResearchDataRoot(), 'experiments');
  }

  getDataRootLfs() {
    return pathResolve(this.getResearchDataRoot(), 'lfs');
  }

  getExperimentFolder(experimentId) {
    return pathResolve(this.getExperimentRoot(), experimentId);
  }

  getAllExperimentFolders() {
    return readdirSync(this.getExperimentRoot());
  }

  /**
   * @return The given app's zip file path, stored for the CurrentResearchProject
   */
  getAppZipFilePath(appLike) {
    const { experimentId } = appLike;
    if (!experimentId) {
      return null;
    }
    return pathResolve(this.getDataRootLfs(), experimentId + AppDataZipFileNameSuffix);
  }

  /** ###########################################################################
   * link folder
   *  #########################################################################*/

  lookupDataRootFolder() {
    const linkPath = getDataFolderLink();
    if (existsSync(linkPath)) {
      this._researchRootFolder = realpathSync(linkPath);
      debug(`Data folder link found: ${this._researchRootFolder}`);
    }
    else {
      // dataFolder = getLogsDirectory();
      this._researchRootFolder = null;
      debug(`No data folder link found.`);
    }
    return this._researchRootFolder;
  }


  /** ###########################################################################
   * data import + export
   *  #########################################################################*/


  getAppFileSize(experimentId) {
    const zipFpath = this.getAppZipFilePath({ experimentId });

    return zipFpath && getFileSizeSync(zipFpath) || 0;
  }

  exportResearchAppData(app) {
    // WARNING: if any of these functions are changed to async, make sure to properly handle all possible race conditions.
    const zipFpath = this.getAppZipFilePath(app);

    const start = performance.now();

    // write zipped backup
    exportApplication(app, zipFpath);

    const time = getPrettyPerformanceDelta(start);

    // const origSize = getUnzippedSize() / 1024 / 1024;
    //  (from ${origSize.toFixed(2)}MB)
    const zipSize = getFileSizeSync(zipFpath) / 1024 / 1024;
    const msg = `Research application data zipped in ${time}s: ${zipSize.toFixed(2)}MB at "${zipFpath}".`;
    showInformationMessage(msg);
  }

  importResearchAppData(experimentId) {
    const zipFpath = this.getAppZipFilePath({ experimentId });

    const start = performance.now();

    const app = importApplication(zipFpath);

    const end = performance.now();

    const time = ((end - start) / 1000).toFixed(2);
    const msg = `Research application data loaded in ${time}s.`;
    showInformationMessage(msg);
    return app;
  }
}

const currentResearch = new Research(CurrentResearchName);

export function getCurrentResearch() {
  return currentResearch;
}
