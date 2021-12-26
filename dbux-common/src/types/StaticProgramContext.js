/** @typedef {import('../Loc').default} Loc */

/**
 * NOTE: this is NOT a `StaticContext`.
 * This thing just tracks extra program information and is added in `staticProgramContextCollection.addProgram`.
 * You can correlate them with other data using `byProgram` and `byFile` indexes,
 * e.g.: `dp.indexes.staticContexts.byFile`
 * 
 * 
 * @type {number}
 */
export default class StaticProgramContext {
  /**
   * WARNING: this is only added by dbux-data (not available during runtime).
   * 
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