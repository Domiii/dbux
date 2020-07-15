import Project from '@dbux/projects/src/projectLib/Project';


export default class RealworldWebComponentsProject extends Project {
  gitRemote = 'gothinkster/web-components-realworld-example-app.git';

  /**
   * @see https://github.com/gothinkster/web-components-realworld-example-app/commit/e435cf6b57a7214c158d289335d2b867c5d45c92
   */
  gitCommit = 'e435cf6b57a7214c158d289335d2b867c5d45c92';
  

  async loadBugs() {
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
    return this.execBackground('node node_modules/webpack-dev-server/bin/webpack-dev-server.js --config ./webpack.config.dbux.js');
  }

  async selectBug(bug) {
    // start webpack and webpack-dev-server
    this.runWebpack();
  }

  async testBugCommand(bug, debugPort) {
    // TODO: no bugs yet
  }
}