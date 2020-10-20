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
        label: 'options: GET,PUT,GET',
        testRe: 'OPTIONS should only include each method once',
        testFilePaths: ['test/app.options.js'],
        bugLocations: [
          {
            fileName: './lib/router/index.js',
            line: 156
          }
        ]
      },
      {
        // https://github.com/BugsJS/express/releases/tag/Bug-2-test
        // https://github.com/BugsJS/express/commit/3260309b422cd964ce834e3925823c80b3399f3c
        id: 2,
        label: 'hop count + HTTPS',
        testRe: [
          'req .protocol when "trust proxy" is enabled when trusting hop count should respect X-Forwarded-Proto',
          // 'when "trust proxy" trusting hop count should respect X-Forwarded-Proto'
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
        label: 'ip vs. subdomains',
        testRe: [
          'should work with IPv[46] address',
          'should return an array with the whole IPv[46]',
        ],
        testFilePaths: ['test/req.subdomains.js']
      },
      {
        // https://github.com/BugsJS/express/commit/796657f6f67bd8f8dfae8d25a2d353c8d657da50
        id: 5,
        label: 'Windows file paths and slashes',
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
        // testFilePaths: ['test/res.sendFile.js']
      },
      {
        id: 8,
        label: 'Router.use: empty path',
        testRe: 'should support empty string path',
        testFilePaths: ['test/app.use.js']
      },
      {
        // https://github.com/BugsJS/express/commit/af824af13e1594e33ca76b9df5983cc4c8ad1b70
        id: 9,
        label: 'empty mountpath',
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
        label: 'send numbers as json',
        testRe: 'should send number as json',
        testFilePaths: ['test/res.send.js'],
        solutionCommit: 'da7b0cdf2abd82c31b1f561d49eb23da81284ae7'
      },
      {
        id: 12,
        label: 'param indexes',
        testRe: [
          'should keep correct parameter indexes',
          'should work following a partial capture group'
        ],
        testFilePaths: ['test/app.router.js']
      },
      {
        id: 13,
        label: 'param override (loki)',
        testRe: 'should support altering req.params across routes',
        testFilePaths: ['test/app.param.js']
      },
      {
        id: 14,
        label: 'empty url in request',
        testRe: 'should handle blank URL',
        testFilePaths: ['test/Router.js']
      },
      {
        // NOTE: shutdown delayed for 2 mins
        id: 15,
        label: 'default Content-Type',
        testRe: [
          'should set the correct  charset for the Content[-]Type',
          'should default the Content-Type'
        ],
        testFilePaths: ['test/res.format.js'],
        require: []
      },
      {
        id: 16,
        label: 'redirect with custom status code',
        testRe: [
          'should include the redirect type'
        ],
        testFilePaths: ['test/res.redirect.js']
      },
      {
        id: 18,
        label: 'param treats next("route") as error',
        testRe: [
          'should not call when values differ on error',
          'should call when values differ when using "next"'
        ],
        testFilePaths: ['test/app.param.js']
      },
      {
        id: 19,
        label: 'req.params should support array of paths',
        testRe: ['should work in array of paths'],
        testFilePaths: ['test/app.router.js']
      },
      {
        id: 20,
        testRe: 'should throw when Content-Type is an array',
        testFilePaths: ['test/res.set.js']
      },
      {
        id: 21,
        testRe: '',
        // testFilePaths: ['']
      },
      {
        id: 22,
        testRe: [
          'should strip port number',
          'should work with IPv6 Host'
        ],
        testFilePaths: ['test/req.host.js'],
        mochaArgs: '--globals setImmediate,clearImmediate',
        require: [] // has no test.env
      },
      {
        // https://github.com/BugsJS/express/commit/6a0221553b49938da5d18d4afcbd5e29ebb363ee
        id: 23,
        testRe: [
          'should support array of paths with middleware array',
          'should accept.* array.* of middleware.*'
        ],
        testFilePaths: ['test/app.use.js']
      },
      {
        id: 24,
        testRe: 'when error occurs in respone handler should pass error to callback',
        testFilePaths: ['test/app.options.js']
      },
      {
        id: 25,
        testRe: 'should ignore object callback parameter with jsonp',
        testFilePaths: ['test/res.jsonp.js']
      },
      {
        id: 26,
        testRe: 'should ignore FQDN in path',
        testFilePaths: ['test/Router.js']
      },
      {
        id: 27,
        testRe: 'should defer all the param routes',
        testFilePaths: ['test/app.param.js']
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
          name: `bug #${bug.id}`,
          description: testRe,
          runArgs: [
            '--grep',
            `"${testRe}"`,
            ...(bug.mochaArgs ? [bug.mochaArgs] : []),
            '--',
            ...bug.testFilePaths
          ],
          require: bug.require || ['./test/support/env.js'],
          ...bug,
          // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
        };
      }).
      filter(bug => !!bug);
  }

  getBugGitTag(bugNumber, tagCategory) {
    return `Bug-${bugNumber}-${tagCategory}`;
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

    // `npm install` again (NOTE: the newly checked out tag might have different dependencies)
    await this.npmInstall();

    // Copy assets again in this branch
    await this.installAssets();

    // Auto commit again
    await this.autoCommit();
  }

  async testBugCommand(bug, cfg) {
    const { projectPath } = this;
    const bugArgs = this.getMochaArgs(bug);

    const mochaCfg = {
      cwd: projectPath,
      mochaArgs: bugArgs,
      require: bug.require,
      ...cfg
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