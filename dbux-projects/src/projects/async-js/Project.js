import Project from '../../projectLib/Project';


/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


export default class AsyncJsProject extends Project {
  gitRemote = 'caolan/async.git';
  gitCommit = 'tags/v3.2.0'
  packageManager = 'yarn';

  decorateExerciseForRun(bug) {
    if (!bug.testFilePaths) {
      // bug not fully configured yet
      return;
    }

    Object.assign(bug, {
      dbuxArgs: '--pw=.* --pb=@babel.* --esnext'
    });
  }
}