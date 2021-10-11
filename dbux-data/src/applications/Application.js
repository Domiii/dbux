import { v4 as uuidv4 } from 'uuid';
import { performance } from '@dbux/common/src/util/universalLibs';
import { pathGetParent, pathSafe } from '@dbux/common/src/util/pathUtil';
import { getPathRelativeToCommonAncestor, pathNormalizedForce, pathRelative } from '@dbux/common-node/src/util/pathUtil';
import RuntimeDataProvider from '../RuntimeDataProvider';
import { newDataProvider } from '../dataProviderImpl';
import { getFileName } from '../util/nodeUtil';

/** @typedef { import("./allApplications").AllApplications } AllApplications */

/**
 * A user-run application, consisting of many `Program`s.
 * The first executed `Program` of an `Application` is its `entryPoint`
 */
export default class Application {
  /**
   * @type {number}
   * @readonly
   */
  applicationId;
  /**
   * @type {string}
   * @readonly
   */
  entryPointPath;
  /**
   * @readonly
   * @type {AllApplications}
   */
  allApplications;
  /**
   * @type {RuntimeDataProvider}
   * @readonly
   */
  dataProvider;

  /**
   * Set only if an application is associated with a "project".
   * @type {string}
   */
  projectName;

  /**
   * time of creation in milliseconds since vscode started
   * @type {number}
   */
  createdAt;
  /**
   * time of last update in milliseconds since vscode started
   * @type {number}
   */
  updatedAt;

  constructor(applicationId, entryPointPath, createdAt, allApplications, uuid = uuidv4()) {
    this.uuid = uuid;
    this.applicationId = applicationId;
    this.entryPointPath = pathNormalizedForce(entryPointPath);
    // this.relativeEntryPointPath = path.relative(entryPointPath, process.cwd()); // path relative to cwd
    this.allApplications = allApplications;
    this.dataProvider = newDataProvider(this);
    this.createdAt = this.updatedAt = createdAt || Date.now();
  }

  addData(allData, isRaw) {
    const start = performance.now();
    try {
      this.dataProvider.addData(allData, isRaw);
    }
    finally {
      const end = performance.now();

      this.lastAddTimeSpent = end - start;
      this.totalTimeSpent = (this.totalTimeSpent || 0) + this.lastAddTimeSpent;
      this.updatedAt = Date.now();
    }

    // if (this.allApplications.getSelectedApplication() === this) {
    //   this.allApplications._emitter.emit('selectedApplicationData', this);
    // }
  }

  /**
   * Uses global appRoot.
   */
  getRelativeEntryPoint() {
    const { appRoot } = this.allApplications;
    const entryPoint = this.entryPointPath;
    // return appRoot && getPathRelativeToCommonAncestor(entryPoint, appRoot) || entryPoint;
    return appRoot && pathRelative(appRoot, entryPoint) || entryPoint;
  }

  getRelativeFolder() {
    return pathGetParent(this.getRelativeEntryPoint());
  }

  /**
   * 
   */
  getPreferredName() {
    const { staticProgramContexts } = this.dataProvider.collections;
    const fileCount = staticProgramContexts.size;
    if (fileCount !== 1) {
      // return `getRelativeFolder` instead
      // return '(unknown)';
      return this.getRelativeFolder();
    }

    const file = staticProgramContexts.getById(1)?.filePath;
    // if (fileCount > 1) {
    //  NOTE: Cannot really do this, since the files might not be available at all.
    //   // multiple files -> look for package.json
    //   return getClosestPackageJsonNameOrPath(file);
    // }

    // just a single file -> return file name
    return getFileName(file);
  }

  getSafeFileName() {
    const name = this.getPreferredName();
    return name && pathSafe(name);
  }

  toString() {
    return `App #${this.applicationId} @${this.entryPointPath}`;
  }
}