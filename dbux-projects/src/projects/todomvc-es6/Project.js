import sh from 'shelljs';
import Project from 'dbux-projects/src/projectLib/Project';


export default class TodomvcEs6Project extends Project {
  gitRemote = 'kentcdodds/es6-todomvc.git';

  rmFiles = [
    'webpack.config.js',
    'package.json',
    '.babelrc'
  ];

  async afterInstall() {
    // get rid of outdated .babelrc
    await sh.rm('-f', './.babelrc');
  }

  loadBugs() {
    return [
      {
        name: 'baseline',
        description: 'Bug-free life',
        runArgs: []
      },
      {
        name: 'error1',
        patch: 'error1',
        description: 'Todo list is always empty. Luckily there is a clear error message.',
        runArgs: []
      },
      {
        name: 'error2',
        patch: 'error2',
        description: 'Todo list is always empty. We see an error message, but it is not the actual bug cause, only a sypmtom.',
        runArgs: []
      },
      {
        name: 'error3',
        patch: 'error3',
        description: 'Todo list is always empty. Sadly no error message is given. Luckily dbux displays an error indicator.',
        runArgs: []
      },
      {
        name: 'error4',
        patch: 'error4',
        description: '"Clear completed" button does not do anything. No error message.',
        runArgs: []
      },
      {
        name: 'error5',
        patch: 'error5',
        description: 'The todo list is always incomplete',
        runArgs: []
      },
      // more bugs:

      // template.show -> template has a minor render defect
      // template.show -> incorrect variable scope causes only one item to be rendered
      
    ].map((bug) => {
      bug.website = 'localhost:3032';
      return bug;
    });
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