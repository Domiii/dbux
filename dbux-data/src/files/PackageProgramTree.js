import StaticProgramContext from '@dbux/common/src/types/StaticProgramContext';
import { parsePackageName, getPackageFolder } from '@dbux/common-node/src/util/moduleUtil';



export class PackageInfo {
  name;

  /**
   * @type {StaticProgramContext[]}
   */
  programs;

  constructor(packageName) {
    this.name = packageName;
  }

  get firstFilePath() {
    return this.programs[0].filePath;
  }

  /**
   * Returns array of all packages in path.
   * Usually `length === 1`, but sometimes dependencies are nested, e.g.:
   * '/some/where/node_modules/@a/a2/a3/a4/node_modules/@b/c' -> `['@a/a2', '@b/c']`
   * 
   * @type {string[]}
   */
  get packageHierarchy() {
    const multi = true;
    return parsePackageName(this.folderPath, multi);
  }

  get folderPath() {
    return getPackageFolder(this.firstFilePath);
  }
}

/** ###########################################################################
 * {@link PackageProgramTree}
 * ##########################################################################*/

/**
 * A package and its executed files (and more?).
 */
export default class PackageProgramTree {
  /**
   * @type {PackageInfo[]}
   */
  packages;

  // TODO
}
