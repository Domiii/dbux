import path from 'path';
import Project from '../../projectLib/Project';


export default class _2048Project extends Project {
  gitRemote = 'gabrielecirulli/2048.git';
  gitCommit = 'fc1ef4f';

  async afterInstall() {

  }

  loadBugs() {
    // git diff --color=never > ../../dbux-projects/assets/todomvc-es6/_patches_/error10.patch
    return [
      {
        // TODO: error stack trace is polluted... can we fix that?
        label: '',
        // patch: '',
        description: '',
        runArgs: [],
        // bugLocations: [
        //   {
        //     file: 'src/controller.js',
        //     line: 65
        //   }
        // ]
      },
    ].map((bug) => {
      bug.website = 'http://localhost:3843';

      bug.testFilePaths = ['app.js'];
      // bug.runFilePaths = bug.testFilePaths;
      bug.watchFilePaths = bug.testFilePaths.map(file => path.join(this.projectPath, 'dist', file));

      return bug;
    });
  }

  async startWatchMode(bug) {
    // start webpack and webpack-dev-server
    let cmd = `node node_modules/webpack-dev-server/bin/webpack-dev-server.js --watch --config ./dbux.webpack.config.js --env entry=${bug.testFilePaths.join(',')}`;
    return this.execBackground(cmd);
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, debugPort) {
    // nothing to do yet
    // TODO: run tests?
  }
}