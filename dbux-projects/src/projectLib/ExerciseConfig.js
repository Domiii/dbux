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
   * Unique number/index of exercise within project.
   * Assigned automatically.
   * @type {number}
   */
  number;

  /**
   * Optional, unique name of exercise within project.
   * Is used to identify name of exercise's asset folder, if {@link #hasAssets} is truthy.
   * @type {string}
   */
  name;

  /**
   * Uniquely identifies this exercise across projects.
   * Set to `${project.name}#${number}`
   * @type {number}
   */
  id;

  /**
   * If exercise was given `name`, uniquely identifies this exercise across projects.
   * Set to `${project.name}#${number}`.
   * @type {string}
   */
  uniqueName;

  /**
   * @type {string}
   */
  description;
  /**
   * @type {string}
   */
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
   * @type {string}
   */
  patch;

  /**
   * If true, assets will be copied from asset exercise folder (identified by {@link #name}).
   * 
   * @type {boolean}
   */
  hasAssets;

  /**
   * Optional array of actual asset names in exercise asset folder.
   * @type {string[]?}
   */
  assets;

  /**
   * Can be used to provide even more information about the exercise.
   * E.g. BugsJs provides discussion logs of developers revolving around the exercise.
   */
  moreDetails;

  hints; // TODO

  /**
   * @type {ExerciseDifficultyConfig}
   */
  difficulty;

  /**
   * @type {ExerciseLocation[]}
   */
  bugLocations;
}