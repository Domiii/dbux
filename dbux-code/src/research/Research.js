import { newLogger } from '@dbux/common/src/log/logger';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import { getPrettyPerformanceDelta } from '@dbux/common/src/util/timeUtil';
import { existsSync, readdirSync, realpathSync } from 'fs';
import { importApplicationFromFile, exportApplicationToFile } from '@dbux/projects/src/dbux-analysis-tools/importExport';
import { getFileSizeSync } from '@dbux/common-node/src/util/fileUtil';
import { performance } from 'perf_hooks';
import { basename } from 'path';
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
const DataFolderLinkName = 'links/dataFolder.lnk';
const AppDataZipFileNameSuffix = '.dbuxapp.zip';

export function getDataFolderPath() {
  return pathResolve(getCodeDirectory(), DataFolderLinkName);
}

/** ###########################################################################
 * {@link Research} class
 * ##########################################################################*/

/**
 * Hackfix: this is a utility class to help hackfixing temporary/research-related code
 * into Dbux.
 */
export class Research {
  name;

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
    if (!this._researchRootFolder) {
      throw new Error(`Invalid research folder location - could not find "${getDataFolderPath()}"`);
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

  getAllExperimentAppFiles() {
    return readdirSync(this.getDataRootLfs());
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

  getAppFileExperimentId(fpath) {
    const file = basename(fpath);
    return file.substring(0, file.length - AppDataZipFileNameSuffix.length);
  }

  /** ###########################################################################
   * link folder
   *  #########################################################################*/

  lookupDataRootFolder() {
    const linkPath = getDataFolderPath();
    if (existsSync(linkPath)) {
      this._researchRootFolder = realpathSync(linkPath);
      debug(`Data folder link found: ${this._researchRootFolder}`);
    }
    else {
      // dataFolder = getLogsDirectory();
      this._researchRootFolder = null;
      debug(`No data folder link found at: ${linkPath}`);
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
    exportApplicationToFile(app, zipFpath);

    const time = getPrettyPerformanceDelta(start);

    // const origSize = getUnzippedSize() / 1024 / 1024;
    //  (from ${origSize.toFixed(2)}MB)
    const zipSize = getFileSizeSync(zipFpath) / 1024 / 1024;
    const msg = `Research application data zipped in ${time}s: ${zipSize.toFixed(2)}MB at "${zipFpath}".`;
    showInformationMessage(msg);
  }

  async importResearchAppData(experimentId) {
    const zipFpath = this.getAppZipFilePath({ experimentId });

    const start = performance.now();

    const app = await importApplicationFromFile(zipFpath);

    const end = performance.now();

    const time = ((end - start) / 1000).toFixed(2);
    const msg = `Research application data loaded in ${time}s.`;
    showInformationMessage(msg);
    return app;
  }
}

let currentResearch;

/**
 * @returns {Research|null}
 */
export function getCurrentResearch() {
  if (process.env.RESEARCH_ENABLED && !currentResearch) {
    currentResearch = new Research(CurrentResearchName);
  }
  return currentResearch;
}
