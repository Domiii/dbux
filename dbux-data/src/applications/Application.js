import { v4 as uuidv4 } from 'uuid';
import { performance } from '@dbux/common/src/util/universalLib';
import { pathGetParent, pathSafe } from '@dbux/common/src/util/pathUtil';
import { getCommonAncestorPath, pathNormalizedForce, pathRelative, renderPath } from '@dbux/common-node/src/util/pathUtil';
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
  uuid;

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
   * Set only if an application is associated with an "experiment" (project -> bug)
   * @type {string}
   */
  experimentId;

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

  /**
   * This is set upon importing or exporting an application from/to file.
   * NOTE: This is not always available.
   * @type {string?}
   */
  filePath;

  constructor(applicationId, entryPointPath, createdAt, allApplications, uuid = uuidv4()) {
    this.uuid = uuid;
    this.applicationId = applicationId;
    this.entryPointPath = pathNormalizedForce(entryPointPath);
    // this.relativeEntryPointPath = path.relative(entryPointPath, process.cwd()); // path relative to cwd
    this.allApplications = allApplications;
    this.dataProvider = newDataProvider(this);
    this.createdAt = this.updatedAt = createdAt || Date.now();
  }

  get applicationUuid() {
    return this.uuid;
  }

  get isExperiment() {
    return !!this.experimentId;
  }

  renderEntryPoint() {
    return renderPath(this.entryPointPath);
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

  getPathRelativeToEntryRoot(fpath) {
    const entryPoint = this.entryPointPath;
    return pathRelative(entryPoint, fpath);
  }

  getPathRelativeToAppAncestorPath(fpath) {
    const ancestorPath = this.getAppCommonAncestorPath();
    return pathRelative(ancestorPath, fpath);
  }

  getPathsRelativeToAppAncestorPath(fpaths) {
    const ancestorPath = this.getAppCommonAncestorPath();
    return fpaths.map(fpath => pathRelative(ancestorPath, fpath));
  }

  getRelativeFolder() {
    return pathGetParent(this.getRelativeEntryPoint());
  }

  getAppCommonAncestorPath() {
    const { staticProgramContexts } = this.dataProvider.collections;
    const paths = staticProgramContexts.getAllExisting().map(p => p.filePath);
    const commonAncestorPath = getCommonAncestorPath(...paths);
    if (paths.length > 1) {
      return commonAncestorPath;
    }
    else {
      return pathGetParent(commonAncestorPath);
    }
  }

  getEntryPointPathRelativeToAppAncestorPath() {
    return this.getPathRelativeToAppAncestorPath(this.entryPointPath);
  }

  getAppPackageJsonPath() {
    // TODO
    // TODO: handle the case where we just run a random script, that happens to be in a folder of some other package (do we need to?)
  }

  /**
   * 
   */
  getPreferredName() {
    if (this.experimentId) {
      return this.experimentId;
    }
    return this.getPreferredFileName();
  }

  getPreferredFileName() {
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
    return `${this.getPreferredName()} #${this.applicationId} @${this.entryPointPath}`;
  }
}