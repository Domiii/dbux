import { PackageId, getPackageId, parsePackageName } from '@dbux/common-node/src/util/moduleUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

export default class PackageInfo {
  packageId;

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
   * @type {number?} Usually undefined. Only set for packages that appear at the top (i.e. "default package").
   */
  order;

  /**
   * @param {PackageId} packageId 
   */
  constructor(packageId, order = undefined) {
    this.packageId = packageId;
    this.names = this.folder && parsePackageName(this.folder, true) || EmptyArray;
    this.order = order;
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
