import { pathJoin } from '@dbux/common-node/src/util/pathUtil';
import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';


export default class RealworldWebComponentsProject extends Project {
  gitRemote = 'gothinkster/web-components-realworld-example-app.git';

  /**
   * @see https://github.com/gothinkster/web-components-realworld-example-app/commit/e435cf6b57a7214c158d289335d2b867c5d45c92
   */
  gitCommit = 'e435cf6b57a7214c158d289335d2b867c5d45c92';
  

  /**
   * @return {ExerciseConfig[]}
   */
  loadExercises() {
    // TODO: add/generate some bugs?
    return [
      {
        id: 1,
        name: 'test',
        description: 'just run it',
        runArgs: []
      }
    ];
  }

  async runWebpack() {
    return this.execBackground('npx webpack serve --config ./dbux.webpack.config.js');
  }

  async selectExercise(bug) {
    // start webpack and webpack-dev-server
    this.runWebpack();
  }

  decorateExerciseForRun(bug) {
    bug.testFilePaths = ['app.js'];
    // bug.runFilePaths = bug.testFilePaths;
    bug.watchFilePaths = bug.testFilePaths.map(file => pathJoin(this.projectPath, 'dist', file));
    bug.website = 'http://localhost:3842/';
  }

  async runCommand(bug, cfg) {
    // TODO: no bugs yet
  }
}