import path from 'path';
import sh from 'shelljs';
import EmptyArray from 'dbux-common/src/util/EmptyArray';
import Project from 'dbux-projects/src/projectLib/Project';


export default class ExpressProject extends Project {
  gitUrl = 'https://github.com/BugsJS/express.git';

  async installDependencies() {
    // # yarn add --dev babel-loader @babel/node @babel/cli @babel/core @babel/preset-env && \
    // # yarn add --dev webpack webpack-cli webpack-dev-server nodemon && \
    // # yarn add core-js@3 @babel/runtime @babel/plugin-transform-runtime
  }

  async installProject() {
    // git clone
    await this.gitClone();

    // install dbux dependencies
    // await this.installDbuxCli();

    // npm install
    await this.npmInstall();

    // TODO: copy assets
    // sh.cp('-u', src, dst);


    // TODO: start webpack if necessary
    // TODO: manage/expose (webpack) bug background process
  }

  async loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        id: 1,
        testRe: 'should only include each method once',
        testFilePaths: ['test/app.options.js'],
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

    // `npm install` again! (NOTE: the bug tag might have different dependencies)
    await this.npmInstall();
  }

  async testBugCommand(bug, debugPort) {
    const {
      projectPath
    } = this;

    // cwd
    sh.cd(projectPath);

    // NOTE: depending on the mode, NYC uses either of the following:
    //  1. simple 
    //    - node-preload - https://www.npmjs.com/package/node-preload ("Request that Node.js child processes preload modules")
    //    - process-on-spawn - 
    //  2. wrapped
    //    - spawn-wrap - https://github.com/istanbuljs/spawn-wrap ("brutal hack [...] in cases where tests or the system under test are loaded via child processes rather than via require(). [...] any child processes launched by that child process will also be wrapped.")

    // TODO: get rid of monoroot dependencies to prepare for deployment
    const MonoRoot = path.resolve(projectPath, '../..');
    const dbuxRegister = `${MonoRoot}/node_modules/dbux-cli/bin/dbux-register.js`;
    const program = `${projectPath}/node_modules/mocha/bin/_mocha`;

    const nodeArgs = `--stack-trace-limit=1000 --nolazy`;
    const nodeDebugArgs = debugPort && `--inspect-brk=${debugPort}` || '';

    // pre-load some modules
    const requireArr = [
      path.join(projectPath, 'test/support/env'),
      dbuxRegister
    ];
    const requireArgs = requireArr.map(r => `--require="${r}"`).join(' ');

    // bugArgs
    const bugArgArray = [
      ...(bug.runArgs || EmptyArray)
    ];
    if (bugArgArray.includes(undefined)) {
      throw new Error(bug.debugTag + ' - invalid `Project bug`. Arguments must not include `undefined`: ' + JSON.stringify(bugArgArray));
    }
    const bugArgs = bugArgArray.join(' ');      //.map(s => `"${s}"`).join(' ');

    // keep alive: if we don't do this, mocha will kill process when run has ended, and we won't receive data sent by runtime
    const keepAlive = '--no-exit';


    // final command
    return `node ${nodeArgs} ${nodeDebugArgs} ${requireArgs} "${program}" ${keepAlive} ${bugArgs}`;


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