import path from 'path';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Project from '../../projectLib/Project';


// TODO: unfinished

export default class ReactProject extends Project {
  gitRemote = 'facebook/react';
  gitCommit = 'tags/v17.0.2';


  makeBuilder() {
    return new WebpackBuilder({
      entry: {
        app: './bootstrap.js',
        vendor: ['todomvc-app-css/index.css'],
      },
      websitePort: 3842
    });
  }

  async afterInstall() {
    // update CSS to correct version (already overwritten in package.json)
    // await this.installPackages(`todomvc-app-css@2.3.0`);
  }

  loadExerciseConfigs() {
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

  decorateExerciseForRun(bug) {
    bug.website = 'http://localhost:3842/';
  }

  async runCommand(bug, cfg) {
    // nothing to do yet
    // TODO: run tests?
  }
}