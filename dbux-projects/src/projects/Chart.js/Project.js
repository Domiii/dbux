import path from 'path';
import sh from 'shelljs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Bug').default} Bug */

export default class ChartJsProject extends Project {
  gitRemote = 'chartjs/Chart.js.git';
  // https://github.com/chartjs/Chart.js/releases/tag/v3.0.0-beta.13
  gitCommit = 'tags/v3.0.0-beta.13';

  packageManager = 'npm';

  async installDependencies() {
    await this.execInTerminal(`npm i -D @rollup/plugin-babel@5.3.0 rollup-plugin-serve@1.1.0`);
  }

  loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        label: 'baseline',
        description: 'Should work just fine.',
        runArgs: [],
      }
    ];

    return bugs.
      map((bug) => {
        bug.website = 'http://localhost:3000';

        bug.testFilePaths = ['app.js'];
        bug.srcFilePaths = bug.testFilePaths;
        bug.distFilePaths = bug.testFilePaths.map(file => path.join(this.projectPath, 'dist', file));

        return bug;
      }).
      filter(bug => !!bug);
  }

  async selectBug(bug) {
    const {
      number, name
    } = bug;
    const tagCategory = "test"; // "test", "fix" or "full"
    const tag = this.getBugGitTag(number, tagCategory);

    if ((await this.getTagName()).startsWith(tag)) {
      // do not checkout bug, if we already on the right tag
      return;
    }

    // checkout the bug branch
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || number}...`);

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this.exec(`git checkout -B ${tag} tags/${tag}`);
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