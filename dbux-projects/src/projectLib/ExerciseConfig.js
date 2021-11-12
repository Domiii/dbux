/** @typedef {import('./Project').default} Project */
/** @typedef {import('./ExerciseRunner').default} ExerciseRunner */
/** @typedef {import('../ProjectsManager').default} PracticeManager */

export class ExerciseDifficultyErrorConfig {
  /**
   * @type {boolean}
   */
  atCause;
}

export class ExerciseDifficultyConfig {
  /**
   * @type {ExerciseDifficultyErrorConfig?}
   */
  error;
}


export default class ExerciseConfig {
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
   * If given, are passed as input files to {@link ExerciseRunner}.
   */
  runFilePaths;

  /**
   * If given, `startWatchMode` will wait for these files to exist before continuing.
   */
  watchFilePaths;

  /**
   * Uniquely identifies this exercise across projects.
   */
  id;
  title;
  description;

  /**
   * [Optional] file name of patch inside of `_patches_` folder to be applied to activate exercise
   */
  patch;

  /**
   * Can be used to provide even more information about the exercise.
   * E.g. BugsJs provides discussion logs of developers revolving around the exercise.
   */
  moreDetails;

  hints; // TODO

  /**
   * @type {[Object]}
   */
  bugLocations;

  /**
   * @type {ExerciseDifficultyConfig}
   */
  difficulty;
}