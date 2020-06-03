import path from 'path';
import sh from 'shelljs';
import Project from 'dbux-projects/src/projectLib/Project';
import { buildMochaRunBugCommand as buildMochaCommand } from 'dbux-projects/src/util/mochaUtil';


export default class ExpressProject extends Project {
  gitUrl = 'https://github.com/BugsJS/express.git';

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
        testRe: 'should only include each method once',
        testFilePaths: ['test/app.options.js']
      },
      {
        id: 2,
        testRe: 'should respect X-Forwarded-Proto',
        testFilePaths: ['test/req.protocol.js']
      },
      {
        // https://github.com/BugsJS/express/commit/796657f6f67bd8f8dfae8d25a2d353c8d657da50
        id: 5,
        testRe: 'should support windows',
        testFilePaths: ['test/utils.js']
      },
      {
        id: 8,
        testRe: 'should support empty string path',
        testFilePaths: ['test/app.use.js']
      },
      {
        // https://github.com/BugsJS/express/commit/af824af13e1594e33ca76b9df5983cc4c8ad1b70
        id: 9,
        testRe: 'should return the mounted path',
        testFilePaths: ['test/app.js']
      },
      {
        // https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
        id: 10,
        testRe: 'should be called for any URL when "*"',
        testFilePaths: ['test/Router.js']
      },
      // {
      //   id: 19,
      //   testRe: '',
      // },
      {
        id: 20,
        testRe: '',
      },
      {
        id: 21,
        testRe: '',
      },
      {
        id: 22,
        testRe: '',
      },
      {
        // https://github.com/BugsJS/express/commit/6a0221553b49938da5d18d4afcbd5e29ebb363ee
        id: 23,
        testRe: 'should accept .* array .* middleware.*',
      },
      {
        id: 24,
        testRe: '',
      },
      {
        id: 25,
        testRe: 'should ignore object callback parameter with jsonp',
      },
      {
        id: 26,
        testRe: 'should ignore FQDN in path',
      },
      {
        id: 27,
        testRe: 'should defer all the param routes',
        testFilePaths: ['test/app.param.js']
        // runArgs: [
        // '--grep',
        // '"should defer all the param routes"',
        // '--',
        // ...testFilePaths
        // ],
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