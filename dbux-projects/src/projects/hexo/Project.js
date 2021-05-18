import sh from 'shelljs';
import isArray from 'lodash/isArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';


export default class HexoProject extends Project {
  gitRemote = 'BugsJS/hexo.git';

  packageManager = 'npm';

  loadBugs() {
    const bugs = [
      {
        // not suitable (not a challenge to find the bug)
        // https://github.com/BugsJS/hexo/releases/tag/Bug-1-test
        // https://github.com/BugsJS/hexo/commit/257794e187864a18cefec5f83e03f1cf2d48331e
        id: 1,
        testRe: '',
        testFilePaths: ['test/scripts/console/generate.js']
      },
      // {
      //   // not suitable (not a challenge to find the bug, multiple lines, change in dependency, very much about domain knowledge)
      //   // https://github.com/BugsJS/hexo/commit/efa4aa39b437f708d4238903bf928dcbca3373ff
      //   id: 2,
      //   testRe: 'read.*() - escape BOM',
      //   testFilePaths: ['test/scripts/box/file.js']
      // }
      // {
      //   // not suitable (not a challenge to find the bug)
      //   id: 3,
      //   testRe: 'is_home',
      //   testFilePaths: ['test/scripts/helpers/is.js']
      // }
      
      {
        // not suitable (not a challenge to find the bug)
        id: 4,
        testRe: 'asset_img (with_space)',
        // testRe: '',
        testFilePaths: ['test/scripts/tags/asset_img.js']
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
            '--grep', `"${testRe}"`,
            '-t', '20000',    // timeout = 20s
            '--',
            // 'test/index.js',
            ...bug.testFilePaths
          ],
          // require: ['./test/support/env.js'],
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

    if ((await this.gitGetCurrentTagName()).startsWith(tag)) {
      // do not checkout bug, if we already on the right tag
      return;
    }

    // checkout the bug branch
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || number}...`);

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this.exec(`git checkout -B ${tag} tags/${tag}`);
  }

  async testBugCommand(bug, cfg) {
    const { projectPath } = this;
    const testArgs = this.getMochaRunArgs(bug);

    const mochaCfg = {
      cwd: projectPath,
      testArgs,
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