/** @typedef {import('../Loc').default} Loc */

/**
 * WARNING: This is a bit of a mess.
 * -> `dbux-babel-plugin` has two versions of this (StaticContextCollection vs. `staticData` `buildDbuxInit` in `staticdata.js`)
 * -> `dbux-runtime` has another version (staticProgramContextCollection)
 * -> `dbux-code` adds `applicationId`
 */
export default class StaticProgramContext {
  /**
   * @type {number}
   */
  applicationId;

  /**
   * `Date.now()`.
   * 
   * @type {number}
   */
  createdAt;
  
  /**
   * @type {number}
   */
  programId;
  
  /**
   * Must be absolute.
   * Currently, StaticProgramContextCollection.serialize takes care of making it relative.
   * 
   * @type {string}
   */
  filePath;
  
  /**
   * @type {string}
   */
  fileName;

  /**
   * Hackfix approach to determining application entry point.
   * NOTE: the first program seen by the `Runtime` is not always the entry point because of load order of new es6+ modules.
   * -> That is why we try to maintain the actual entry point number here, but it only works if the entire application is processed by a singular babel process (which is usually how it works).
   * @type {number}
   */
  programIndex;
}