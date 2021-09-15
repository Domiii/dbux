import path from 'path';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Project from '../../projectLib/Project';


export default class ReactProject extends Project {
  gitRemote = 'facebook/react';
  gitCommit = 'tags/v17.0.2';

  rmFiles = [
    'webpack.config.js',
    'package.json',
    '.babelrc'
  ];

  entry = {
    app: './bootstrap.js',
    vendor: ['todomvc-app-css/index.css'],
  };

  watchFilePaths = ['app.js'];

  makeBuilder() {
    return new WebpackBuilder({
      websitePort: 3842,
      rootPath: 'src',
    });
  }

  async afterInstall() {
    // update CSS to correct version (already overwritten in package.json)
    // await this.installPackages(`todomvc-app-css@2.3.0`);
  }

  loadBugs() {
    return [
      {
        label: 'Empty list with clear error message',
        patch: 'error1',
        description: 'TODO items never show up. Luckily there is a clear error message.',
        runArgs: [],
        bugLocations: [
          {
            file: 'src/controller.js',
            line: 65
          }
        ]
      }
    ];
  }

  decorateBugForRun(bug) {
    bug.testFilePaths = ['app.js'];
    // bug.runFilePaths = bug.testFilePaths;
    bug.watchFilePaths = bug.testFilePaths.map(file => path.join(this.projectPath, 'dist', file));
    bug.website = 'http://localhost:3842/';
  }

  async testBugCommand(bug, cfg) {
    // nothing to do yet
    // TODO: run tests?
  }
}