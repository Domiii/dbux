import sh from 'shelljs';
import isArray from 'lodash/isArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';


export default class HexoProject extends Project {
  gitRemote = 'BugsJS/hexo.git';

  packageManager = 'yarn';

  loadBugs() {
    const bugs = [
      {
        // not a challenge to find the bug
        // https://github.com/BugsJS/hexo/releases/tag/Bug-1-test
        // https://github.com/BugsJS/hexo/commit/257794e187864a18cefec5f83e03f1cf2d48331e
        id: 1,
        testRe: '',
        testFilePaths: ['test/scripts/console/generate.js']
      },
      // {
      //   // not a challenge to find the bug, multiple lines, change in dependency, very much about domain knowledge
      //   // https://github.com/BugsJS/hexo/commit/efa4aa39b437f708d4238903bf928dcbca3373ff
      //   id: 2,
      //   testRe: 'read.*() - escape BOM',
      //   testFilePaths: ['test/scripts/box/file.js']
      // }
      // {
      //   // not a challenge to find the bug
      //   id: 3,
      //   testRe: 'is_home',
      //   testFilePaths: ['test/scripts/helpers/is.js']
      // }
      
      {
        // not a challenge to find the bug
        id: 4,
        testRe: 'asset_img.*with space',
        // testRe: '',
        testFilePaths: ['test/scripts/tags/asset_img.js']
      },
      // 5: stale.yml (not js)
      // 6: url_for helper: Don't prepend root if url is started with #
      // 7: version in `package.json` (not js)
      // 8: appveyor: add node.js 7 testing environment (not js)

      {
        /**
         * @see https://github.com/BugsJS/hexo/commit/34f34ab2acba87776c78be5af9b27a8b3da3d435
         */
        id: 9,
        testRe: 'context|current = 0',
        testFilePaths: ['test/scripts/helpers/paginator.js']
      },
      {
        /**
         * @see https://github.com/BugsJS/hexo/commit/d08b4694de636432b0a992f32b3a5c2548c662e2
         */
        id: 10,
        testRe: '_generate() - return nothing in generator',
        testFilePaths: ['test/scripts/hexo/hexo.js']
      },
      {
        /**
         * @see https://github.com/BugsJS/hexo/commit/0348931634d60a074597d5482c5ffae8a8f9cae6
         */
        id: 11,
        testRe: 'constructs mutli-config',
        testFilePaths: ['test/scripts/hexo/hexo.js']
      },
      {
        /**
         * @see https://github.com/BugsJS/hexo/commit/59a6920df0233584505e44cd43be2cc788b8f2b2
         */
        id: 12,
        testRe: 'non-string title',
        testFilePaths: ['test/scripts/hexo/post.js']
      }
    ];

    return bugs;
  }

  decorateBug(bug) {
    if (!bug.testFilePaths) {
      // bug not ready yet
      return;
    }

    let {
      description,
      testRe,
      testFilePaths
    } = bug;
    if (isArray(testRe)) {
      testRe = testRe.map(re => `(?:${re})`).join('|');
    }

    testRe = testRe.replace(/"/g, '\\"');

    Object.assign(bug, {
      name: `bug #${bug.id}`,
      description: description || testRe || testFilePaths[0] || '',
      runArgs: [
        '--grep', `"${testRe}"`,
        '-t', '20000',    // timeout = 20s
        '--',
        // 'test/index.js',
        ...testFilePaths
      ],
      // require: ['./test/support/env.js'],
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)

      // dbuxArgs: '--pw=.*',
    });
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
    await this.exec(`${this.gitCommand} checkout -B ${tag} tags/${tag}`);
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