/** @typedef {import('../Loc').default} Loc */

export default class StaticProgramContext {
  /**
   * @type {number}
   */
  applicationId;
  
  /**
   * @type {number}
   */
  programId;
  
  /**
   * @type {string}
   */
  filePath;
  
  /**
   * @type {string}
   */
  fileName;

  /**
   * @type {string | null}
   */
  moduleName;
}