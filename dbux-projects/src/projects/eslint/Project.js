import sh from 'shelljs';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';


export default class EslintProject extends Project {
  gitRemote = 'BugsJS/eslint.git';

  packageManager = 'npm';

  // async installDependencies() {
  //   yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
  //   yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
  //   yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime
  // }

  loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
      {
        id: 1,
        testRe: '',
        testFilePaths: ['tests/lib/rules/no-obj-calls.js']
      }
    ];

    return bugs.
      map((bug) => {
        if (!bug.testFilePaths) {
          // bug not fully configured yet
          return null;
        }

        return {
          // id: i + 1,
          name: `bug #${bug.id}`,
          description: bug.testRe,
          runArgs: [
            '--grep',
            `"${bug.testRe}"`,
            '--',
            ...bug.testFilePaths,
            // eslint-disable-next-line max-len
            // 'tests/lib/rules/**/*.js tests/lib/*.js tests/templates/*.js tests/bin/**/*.js tests/lib/code-path-analysis/**/*.js tests/lib/config/**/*.js tests/lib/formatters/**/*.js tests/lib/internal-rules/**/*.js tests/lib/testers/**/*.js tests/lib/util/**/*.js'
          ],
          // require: ['test/support/env'],
          ...bug,
          // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
        };
      }).
      filter(bug => !!bug);
  }

  getBugGitTag(bugId, tagCategory) {
    return `Bug-${bugId}-${tagCategory}`;
  }

  async selectBug(bug) {
    const {
      id, name
    } = bug;
    const tagCategory = "test"; // "test", "fix" or "full"
    const tag = this.getBugGitTag(id, tagCategory);

    // TODO: auto commit any pending changes
    // TODO: checkout bug, if not done so before

    // checkout the bug branch
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || id}...`);

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this.exec(`git checkout -B ${tag} tags/${tag}`);

    // `npm install` again! (NOTE: the buggy version might have different dependencies)
    await this.npmInstall();
  }

  async testBugCommand(bug, cfg) {
    const { projectPath } = this;
    const bugArgs = this.getMochaArgs(bug, [
      '-t 10000' // timeout
    ]);

    const mochaCfg = {
      cwd: projectPath,
      mochaArgs: bugArgs,
      require: bug.require,
      ...cfg
    };

    // delete mochaCfg.dbuxJs; // no dbux -> run the test as-is

    return 'bash ~/.nvm/nvm.sh use 7 && ' + await buildMochaRunCommand(mochaCfg);
  }
}