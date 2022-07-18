import { requireUncached } from '@dbux/common-node/src/util/requireUtil';
import path from 'path';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Project from '../../projectLib/Project';


export default class ReactProject extends Project {
  gitRemote = 'real-world-debugging/react-tutorial-solutions';
  // gitCommit = 'tags/v17.0.2';


  makeBuilder() {
    const configFilePath = this.getAssetPath('config', this.name, 'webpack.settings.js');
    // const chapterRegistry = JSON.parse(fs.readFileSync(chapterListFile, 'utf-8'));
    const configFn = requireUncached(configFilePath);
    const config = configFn(this);

    return new WebpackBuilder({
      ...config
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
