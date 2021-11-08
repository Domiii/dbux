/** @typedef {import('./Project').default} Project */
/** @typedef {import('../ProjectsManager').default} PracticeManager */


export default class BugConfig {
  /**
     * @type {Project}
     */
  project;

  /**
   * Not used too much.
   * If given, we used this to open the first of these files in editor.
   * But that is now replaced by `mainEntryPoint`
   * @type {[]?}
   */
  testFilePaths;

  /**
   * File to open in editor, if exists
   */
  mainEntryPoint;

  /**
   * If given, are passed as input files to bug runner.
   */
  runFilePaths;

  /**
   * If given, `startWatchMode` will wait for these files to exist before continuing.
   */
  watchFilePaths;

  /**
   * Uniquely identifies this bug across projects.
   */
  id;
  title;
  description;

  /**
   * [Optional] file name of patch inside of `_patches_` folder to be applied to activate bug
   */
  patch;

  /**
   * Can be used to provide even more information about the bug.
   * E.g. BugsJs provides discussion logs of developers revolving around the bug.
   */
  moreDetails;

  hints; // TODO
  difficulty; // TODO!

  /**
   * @type {[Object]}
   */
  bugLocations;
}