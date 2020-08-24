import sh from 'shelljs';
import isArray from 'lodash/isArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';


export default class ExpressProject extends Project {
  gitRemote = 'BugsJS/express.git';

  packageManager = 'npm';

  loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        // https://github.com/BugsJS/express/releases/tag/Bug-1-test
        // https://github.com/BugsJS/express/commit/8bd36202bef586889d20bd5fa0732d3495da54eb
        id: 1,
        testRe: 'should only include each method once',
        testFilePaths: ['test/app.options.js']
      },
      {
        // https://github.com/BugsJS/express/releases/tag/Bug-2-test
        // https://github.com/BugsJS/express/commit/3260309b422cd964ce834e3925823c80b3399f3c
        id: 2,
        testRe: [
          'req .protocol when "trust proxy" is enabled when trusting hop count should respect X-Forwarded-Proto',
          'when "trust proxy" trusting hop count should respect X-Forwarded-Proto'
        ],
        testFilePaths: ['test/req.protocol.js', 'test/req.secure.js']
      },
      // {
      //   // NOTE: this test passes by default
      //   // https://github.com/BugsJS/express/commit/4a59ea5dd0a7cb5b8cce80be39a5579876993cf1
      //   id: 3,
      //   testRe: 'res .* should work when only .default is provided',
      //   testFilePaths: ['test/res.format.js']
      // },
      {
        // https://github.com/BugsJS/express/commit/337662df8c02d379e5a14b4f0155ecb29b4aa81e
        id: 4,
        testRe: [
          'should work with IPv[46] address',
          'should return an array with the whole IPv[46]',
        ],
        testFilePaths: ['test/req.subdomains.js']
      },
      {
        // https://github.com/BugsJS/express/commit/796657f6f67bd8f8dfae8d25a2d353c8d657da50
        id: 5,
        testRe: 'utils\\.isAbsolute\\(\\) should support windows',
        testFilePaths: ['test/utils.js']
      },
      // {
      //   // NOTE: passing by default
      //   // https://github.com/BugsJS/express/commit/f07f197a3cc7805bce37b3a4908e844b8d7f7455
      //   id: 6,
      //   testRe: 'app.head\\(\\) should override prior',
      //   testFilePaths: ['test/app.head.js'],
      //   require: []
      // },
      {
        id: 7,
        testRe: '.sendFile.* (should invoke the callback without error when HEAD|should invoke the callback without error when 304)',
        testFilePaths: ['test/res.sendFile.js']
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
      // {
      //   // https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
      //   id: 10,
      //   testRe: 'should be called for any URL when "*"',
      //   testFilePaths: ['test/Router.js']
      // },
      {
        id: 11,
        testRe: 'should send number as json',
        testFilePaths: ['test/res.send.js']
      },
      {
        id: 12,
        testRe: [
          'should keep correct parameter indexes',
          'should work following a partial capture group'
        ],
        testFilePaths: ['test/app.router.js']
      },
      {
        id: 13,
        testRe: 'should support altering req.params across routes',
        testFilePaths: ['test/app.param.js']
      },
      {
        id: 14,
        testRe: 'should handle blank URL',
        testFilePaths: ['test/Router.js']
      },
      {
        // NOTE: process does not exit
        id: 15,
        testRe: [
          // 'should set the correct charset for the Content\\-Type',
          'should default the Content-Type'
        ],
        testFilePaths: ['test/res.format.js'],
        require: []
      },
      {
        id: 16,
        testRe: [
          'should include the redirect type'
        ],
        testFilePaths: ['test/res.redirect.js']
      },
      {
        id: 18,
        testRe: [
          'should not call when values differ on error',
          'should call when values differ when using "next"'
        ],
        testFilePaths: ['test/app.param.js']
      },
      {
        id: 19,
        testRe: ['should work in array of paths'],
        testFilePaths: ['test/app.router.js']
      },
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

        let { testRe } = bug;
        if (isArray(testRe)) {
          testRe = testRe.map(re => `(?:${re})`).join('|');
        }

        testRe = testRe.replace(/"/g, '\\"');

        return {
          // id: i + 1,
          name: `bug #${bug.id}`,
          description: testRe,
          runArgs: [
            '--grep',
            `"${testRe}"`,
            '--',
            ...bug.testFilePaths
          ],
          require: ['./test/support/env.js'],
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

    // Copy assets again in this branch
    await this.installAssets();
  }

  async testBugCommand(bug, cfg) {
    const { projectPath, manager } = this;
    const bugArgs = this.getMochaArgs(bug);

    let {
      debugPort,
      nodeArgs,
      dbuxArgs
    } = cfg;

    const mochaCfg = {
      cwd: projectPath,
      dbuxJs: manager.getDbuxCliBinPath(),
      mochaArgs: bugArgs,
      nodeArgs,
      dbuxArgs,
      require: bug.require,
      debugPort
    };

    return buildMochaRunCommand(mochaCfg);

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