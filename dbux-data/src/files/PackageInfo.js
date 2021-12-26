import { PackageId, getPackageId, parsePackageName } from '@dbux/common-node/src/util/moduleUtil';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

export default class PackageInfo {
  name;
  folder;


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
  programs;

  /**
   * @param {PackageId} packageId 
   */
  constructor(packageId) {
    this.name = packageId.name;
    this.folder = packageId.folder;
    this.names = this.folder && parsePackageName(this.folder, true) || EmptyArray;
  }

  get key() {
    return this.folder;
  }

  get firstFilePath() {
    return this.programs[0].filePath;
  }
}
