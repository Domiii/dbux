import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Project from '../../projectLib/Project';


// TODO: unfinished

export default class ReactProject extends Project {
  gitRemote = 'real-world-debugging/react-tutorial-solutions';
  // gitCommit = 'tags/v17.0.2';


  makeBuilder() {
    return new WebpackBuilder({
      entry: {
        index: 'src/index.js',
        // vendor: ['todomvc-app-css/index.css'],
      },
      webpackConfig: {
        babelOptions: {
          presets: [
            '@babel/preset-react'
          ]
        }
      },
      websitePort: 3843
    });
  }

  async afterInstall() {
  }

  loadExerciseConfigs() {
    return [
      {
        label: 'Baseline',
        // patch: 'error1',
        runArgs: []
      }
    ];
  }

  decorateExerciseForRun(bug) {
  }

  async runCommand(bug, cfg) {
    // nothing to do yet
    // TODO: run tests?
  }
}