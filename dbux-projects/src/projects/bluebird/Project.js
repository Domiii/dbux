import Project from '../../projectLib/Project';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


/**
 * NOTE: this is not a good project to play around with
 * * `js` folder is search-ignored, so search leads you to the (not executed) `src` folder
 * * what's worse is: changes to the `js` folder will be overwritten on next `install`; have to commit all changes to `src` before use...
 * 
 */
export default class BluebirdProject extends Project {
  gitRemote = 'petkaantonov/bluebird.git';
  gitCommit = 'tags/v3.7.2'

  packageManager = 'yarn';

  decorateExercise(config) {
    Object.assign(config, {
      dbuxArgs: '--pw=.*'
    });
    return config;
  }
}