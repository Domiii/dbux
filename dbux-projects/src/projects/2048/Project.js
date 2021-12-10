import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
// import { getAllFilesInFolders } from '../../util/fileUtil';


/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


export default class _2048Project extends Project {
  gitRemote = 'gabrielecirulli/2048.git';
  gitCommit = 'fc1ef4f';

  makeBuilder() {
    return new WebpackBuilder({
      websitePort: 3843,
      entryPattern: 'js/*'
    });
  }

  async afterInstall() {
    await this.execInTerminal('npm init -y');
    // await this.autoCommit(); // NOTE: autoCommit is called right after this method

    // NOTE: we need to expose all globals manually, since there is no easy way to workaround that problem with Webpack
    await this.applyPatch('baseline');
  }

  decorateExercise(config) {
    config.mainEntryPoint = ['js/application.js'];
    return config;
  }

  async runCommand(bug, cfg) {
    // nothing to do
  }
}