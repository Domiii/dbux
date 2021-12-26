import { PackageId, getPackageId, parsePackageName } from '@dbux/common-node/src/util/moduleUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

export default class PackageInfo {
  /**
   * Array of all packages in path.
   * Usually `length === 1`, but sometimes dependencies are nested, e.g.:
   * '/some/where/node_modules/@a/a2/a3/a4/node_modules/@b/c' -> `['@a/a2', '@b/c']`
   * 
   * @type {string[]}
   */
  names;

  /**
   * @type {StaticProgramContext[]}
   */
  programs = [];

  /**
   * @param {PackageId} packageId 
   */
  constructor(packageId) {
    this.packageId = packageId;
    this.names = this.folder && parsePackageName(this.folder, true) || EmptyArray;
  }

  get name() {
    return this.packageId.name;
  }

  get folder() {
    return this.packageId.folder;
  }

  get key() {
    return this.folder;
  }

  get firstFilePath() {
    return this.programs[0].filePath;
  }
}
