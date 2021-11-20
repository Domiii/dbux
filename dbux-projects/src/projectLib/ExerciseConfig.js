/** @typedef {import('../ProjectsManager').default} PracticeManager */
/** @typedef {import('./ExerciseRunner').default} ExerciseRunner */
/** @typedef {import('./Project').default} Project */
/** @typedef {import('./Exercise').ExerciseLocation} ExerciseLocation */

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
   * Uniquely identifies this exercise across projects.
   */
  id;
  number;
  name;
  description;
  label;

  /**
   * Not used too much.
   * If given, we used this to open the first of these files in editor.
   * But that is now replaced by `mainEntryPoint`
   * @type {string[]}
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
   * @type {ExerciseLocation[]}
   */
  bugLocations;

  /**
   * @type {ExerciseDifficultyConfig}
   */
  difficulty;
}