import path from 'path';
import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Exercise from '../../projectLib/Exercise';
import Project from '../../projectLib/Project';

/** @typedef {import('../../projectLib/ExerciseConfig').default} ExerciseConfig */


const RelativeRoot = 'examples/vanilla-es6';

export default class TodomvcEs6Project extends Project {
  gitRemote = 'real-world-debugging/todomvc-es6';
  gitTargetRef = 'v1';
  // gitCommit = 'fed8e56';

  rmFiles = [
  ];

  get srcRoot() {
    return pathResolve(this.projectPath, RelativeRoot);
  }

  getNpmInstallFolder() {
    return this.srcRoot;
  }

  getAbsoluteFilePath(fpath) {
    return pathResolve(this.srcRoot, fpath || '');
  }

  makeBuilder() {
    const projectRoot = this.srcRoot;
    return new WebpackBuilder({
      projectRoot, // NOTE: this is also used as `context`
      websitePort: 3842,
      // websitePath: ,
      // context: this.srcRoot,
      entry: {
        bundle: 'src/app.js',
        // vendor: ['todomvc-app-css/index.css'],
      },
      htmlPlugin: true,
      webpackConfig: {
        devServer: {
          devMiddleware: {
            publicPath: '/'
          },
          static: [
            {
              directory: path.resolve(projectRoot),
              publicPath: '/'
            }
          ]
        }
      }
    });
  }

  async afterInstall() {
    // await this.applyPatch('baseline');
  }

  /**
   * 
   * @param {Exercise} exercise 
   */
  decorateExerciseForRun(exercise) {
    // fix relative file paths
    // exercise.mainEntryPoint = this.builder.getEntryOutputPath('bundle', exercise);
    exercise.mainEntryPoint = pathResolve(this.projectPath, 'src/app.js');
    if (exercise.bugLocations) {
      exercise.bugLocations = exercise.bugLocations.map(loc => (loc && {
        ...loc,
        file: this.getAbsoluteFilePath(loc.file)
      }));
    }
  }

  async runCommand(bug, cfg) {
    // nothing to do yet
  }
}
