import sh from 'shelljs';
import Project from 'dbux-projects/src/projectLib/Project';


export default class TodomvcEs6Project extends Project {
  gitUrl = 'https://github.com/kentcdodds/es6-todomvc.git';

  rmFiles = [
    'webpack.config.js',
    'package.json',
    '.babelrc'
  ];

  async afterInstall() {
    // get rid of outdated .babelrc
    await sh.rm('-f', './.babelrc');
  }

  async loadBugs() {
    return [
      {
        name: 'baseline',
        description: 'Bug-free life',
        runArgs: []
      },
      {
        name: 'error1',
        patch: 'error1',
        description: 'todos are not showing up. Luckily there is a clear error message.',
        runArgs: []
      },
      {
        name: 'error2',
        patch: 'error2',
        description: 'todos are not showing up. We see an error, but it is not the actual bug cause, only a sypmtom.',
        runArgs: []
      },
      {
        name: 'error3',
        patch: 'error3',
        description: 'todos are not showing up. Sadly no error is visible.',
        runArgs: []
      }
    ];
  }

  async startWatchMode() {
    // start webpack and webpack-dev-server
    return this.execBackground('node node_modules/webpack-dev-server/bin/webpack-dev-server.js --config ./webpack.config.dbux.js');
  }

  async selectBug(bug) {
    // nothing to do
  }

  async testBugCommand(bug, debugPort) {
    // nothing to do yet
    // TODO: run tests?
  }
}