import path from 'path';
import sh from 'shelljs';
import Project from 'dbux-projects/src/projectLib/Project';
import { buildMochaRunBugCommand as buildMochaCommand } from 'dbux-projects/src/util/mochaUtil';


export default class EslintProject extends Project {
  gitUrl = 'https://github.com/BugsJS/eslint.git';

  packageManager = 'npm';

  // async installDependencies() {
  //   yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
  //   yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
  //   yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime
  // }

  async loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        id: 1,
        testRe: '',
        testFilePaths: ['test/app.options.js']
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
            ...bug.testFilePaths
          ],
          require: ['test/support/env'],
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

  async testBugCommand(bug, debugPort) {
    const { projectPath } = this;
    const bugArgs = this.getBugArgs(bug);
    return buildMochaCommand(projectPath, bugArgs, bug.require, debugPort);

    // TODO: enable auto attach (run command? or remind user?)
    //      see: https://code.visualstudio.com/blogs/2018/07/12/introducing-logpoints-and-auto-attach
    /*
    "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/_mocha",
      "runtimeArgs": [
        "--stack-trace-limit=1000",
        "--preserve-symlinks"
      ],
      "cwd": "${workspaceFolder}",
      "args": [
        // "--reporter=json",
      ],
      */
  }
}