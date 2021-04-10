import path from 'path';
import sh from 'shelljs';
import Project from '../../projectLib/Project';


export default class TodomvcEs6Project extends Project {
  gitRemote = 'kentcdodds/es6-todomvc.git';
  gitCommit = 'bf2db41';

  rmFiles = [
    'webpack.config.js',
    'package.json',
    '.babelrc'
  ];

  async afterInstall() {
    // update CSS to correct version
    await this.execInTerminal(`npm install todomvc-app-css@2.3.0 --force`);
  }

  loadBugs() {
    // git diff --color=never > ../../dbux-projects/assets/todomvc-es6/_patches_/error10.patch
    return [
      {
        // TODO: error stack information is polluted... can we fix that?
        label: 'error1',
        patch: 'error1',
        description: 'TODO list is always empty. Luckily there is a clear error message.',
        runArgs: [],
        bugLocations: [
          {
            file: 'src/controller.js',
            line: 65
          }
        ]
      },
      {
        label: 'error2',
        patch: 'error2',
        description: 'TODO list is always empty. We see an error message, but it is not the actual bug cause, only a symptom.',
        runArgs: []
      },
      {
        label: 'error3',
        patch: 'error3',
        description: 'TODO list is always empty. Sadly no error message is given. Luckily dbux displays an error indicator.',
        runArgs: []
      },
      {
        // for-loop, off-by-one
        label: 'error6',
        patch: 'error6',
        description: 'TODO list never renders the last element.',
        runArgs: [],
        bugLocations: [
          {
            file: 'src/template.js',
            line: 65
          }
        ]
      },
      {
        // ternary, css, branch logic reversed
        label: 'Reversed strikethrough',
        patch: 'error7',
        description: 'Strikethrough logic for TODO items is incorrect.',
        runArgs: [],
        bugLocations: [
          {
            file: 'src/view.js',
            line: 188
          }
        ]
      },
      {
        // typo, variable
        label: 'Incorrect "items left" amount',
        patch: 'error8',
        description: 'TODO',
        runArgs: [],
        bugLocations: [
          {
            file: 'src/model.js',
            line: 106
          }
        ]
      },
      {
        label: 'error5',
        patch: 'error5',
        description: 'TODO list is not rendered completely if it contains more than one element.',
        runArgs: []
      },
      {
        label: 'error4',
        patch: 'error4',
        description: '"Clear completed" button does not do anything. No error message.',
        runArgs: []
      },
      // more bugs:

      // template.show -> template has a minor render defect
      // template.show -> incorrect variable scope causes only one item to be rendered

      {
        // see: https://github.com/kentcdodds/es6-todomvc/issues/39
        // TODO: description + steps to reproduce
        label: 'original: wrong filter render state',
        description: 'Has an unintentional bug not fixed in original code.',
        runArgs: [],
        bugLocations: [
          // NOTE: don't re-create `TODO`, but re-use if exists already
          {
            file: 'src/todo.js',
            line: 27
          }
        ]
      },
      
    ].map((bug) => {
      bug.website = 'http://localhost:3033';

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