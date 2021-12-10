import Project from '../../projectLib/Project';


/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


export default class AsyncJsProject extends Project {
  gitRemote = 'caolan/async.git';
  gitCommit = 'tags/v3.2.0'
  packageManager = 'yarn';

  canRunExercise(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    Object.assign(config, {
      dbuxArgs: '--pw=.* --pb=@babel.* --esnext'
    });
    return config;
  }
}