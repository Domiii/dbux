import path from 'path';
import sh from 'shelljs';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
// import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Exercise').default} Bug */
/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


export default class ChartJsProject extends Project {
  gitRemote = 'chartjs/Chart.js.git';
  // https://github.com/chartjs/Chart.js/releases/tag/v3.0.0-beta.13
  gitCommit = 'tags/v3.0.0-beta.13';

  packageManager = 'npm';

  async installDependencies() {
    await this.execInTerminal(`npm i -D @rollup/plugin-babel@5.3.0 rollup-plugin-serve@1.1.0`);
  }

  postLoadExerciseConfig(config) {
    config.website = config.website || 'http://localhost:10001/samples/index.html';
    config.testFilePaths = ['src/index.js'];

    const outputFiles = ['chart.min.js'];
    config.watchFilePaths = outputFiles.map(file => path.join('dist', file));

    return config;
  }


  // ###########################################################################
  // run
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async startWatchMode(bug) {
    return this.execBackground('npx rollup -c');
  }

  async runCommand(bug, cfg) {
    // TODO
  }
}