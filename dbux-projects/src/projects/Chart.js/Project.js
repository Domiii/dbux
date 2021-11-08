import path from 'path';
import sh from 'shelljs';
// import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
// import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Exercise').default} Bug */
/** @typedef {import('../../projectLib/BugConfig').default} BugConfig */


export default class ChartJsProject extends Project {
  gitRemote = 'chartjs/Chart.js.git';
  // https://github.com/chartjs/Chart.js/releases/tag/v3.0.0-beta.13
  gitCommit = 'tags/v3.0.0-beta.13';

  packageManager = 'npm';

  async installDependencies() {
    await this.execInTerminal(`npm i -D @rollup/plugin-babel@5.3.0 rollup-plugin-serve@1.1.0`);
  }

  /**
   * @return {BugConfig[]}
   */
  loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        label: 'baseline',
        description: 'Baseline: select sample page.',
        runArgs: [],
        website: 'http://localhost:10001/samples/index.html'
      },
      {
        label: 'baseline_vertical_bar',
        description: 'Baseline: vertical bar graph.',
        runArgs: [],
        website: 'http://localhost:10001/samples/charts/bar/vertical.html'
      },
      // more bugs:
      // {
      // * easingFunction is not a function (v2 only?) - https://github.com/chartjs/Chart.js/issues/7180
      // * maxTicksLimit does not work for gridlines when ticks are not displayed - https://github.com/chartjs/Chart.js/issues/7302
      // }
      // bugs not suited for learning:
      // * Right-most point gets cut off in line chart: more of a layout bug or feature change - https://github.com/chartjs/Chart.js/issues/6414
      //
      // bugs that seem good but...:
      // * only on ipad, iphone; also not reliably reproducible - https://github.com/chartjs/Chart.js/issues/6235
    ];

    return bugs.
      map((bug) => {
        bug.website = bug.website || 'http://localhost:10001/samples/index.html';
        bug.testFilePaths = ['src/index.js'];

        const outputFiles = ['chart.min.js'];
        bug.watchFilePaths = outputFiles.map(file => path.join('dist', file));

        return bug;
      }).
      filter(bug => !!bug);
  }


  // ###########################################################################
  // run
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async startWatchMode(bug) {
    return this.execBackground('npx rollup -c');
  }

  async testBugCommand(bug, cfg) {
    // TODO
  }
}