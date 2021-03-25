import path from 'path';
import sh from 'shelljs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/Bug').default} Bug */

export default class EslintProject extends Project {
  gitRemote = 'BugsJS/eslint.git';

  packageManager = 'npm';

  // TODO: get nodeVersion by bug instead
  nodeVersion = '7';
  
  async installDependencies() {
    // TODO: install Babel plugins in dev mode, if not present
    const webpackJs = this.getWebpackJs();
    if (!sh.test('-f', webpackJs)) {
      await this.execInTerminal(`npm i -D webpack@4.41.5 webpack-cli@3.3.10 webpack-node-externals@2.5.0 string-replace-loader@2.3.0`);
    }

    // add "dist" folder to gitignore
    await this.exec('bash -c "echo ""dist"" >> .gitignore"');
  }


  loadBugs() {
    // TODO: load automatically from BugsJs bug database
    // NOTE: some bugs have multiple test files, or no test file at all
    // see: https://github.com/BugsJS/express/releases?after=Bug-4-test
    const bugs = [
      {
        // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
        id: 1,
        testRe: '',
        nodeVersion: 7,
        testFilePaths: ['tests/lib/rules/no-obj-calls.js']
      },
      // {
      //   // test file too large
      //   // see https://github.com/BugsJS/eslint/commit/125f20e630f01d67d9433ef752924a5bb75005fe
      //   id: 2,
      //   testRe: '',
      //   testFilePaths: ['']
      // },
      // {
      //   // problem: load-rules
      //   id: 3,
      //   testRe: '',
      //   nodeVersion: 8,
      //   testFilePaths: ['tests/lib/rules/prefer-template.js']
      // },
      {
        // see https://github.com/BugsJS/eslint/commit/e7839668c859752e5237c829ee2a1745625b7347
        id: 4,
        testRe: '',
        nodeVersion: 7,
        testFilePaths: ['tests/lib/rules/no-dupe-keys.js']
      },
    ];

    return bugs.
      map((bug) => {
        if (!bug.testFilePaths) {
          // bug not fully configured yet
          return null;
        }

        const runFilePaths = bug.testFilePaths;
        let watchFilePaths = bug.testFilePaths.map(file => path.join(this.projectPath, 'dist', file));

        return {
          // id: i + 1,
          name: `bug #${bug.id}`,
          description: bug.testRe,
          runArgs: [
            '--grep',
            `"${bug.testRe}"`,
            '--',
            // ...watchFilePaths,
            // eslint-disable-next-line max-len
            // 'tests/lib/rules/**/*.js tests/lib/*.js tests/templates/*.js tests/bin/**/*.js tests/lib/code-path-analysis/**/*.js tests/lib/config/**/*.js tests/lib/formatters/**/*.js tests/lib/internal-rules/**/*.js tests/lib/testers/**/*.js tests/lib/util/**/*.js'
          ],
          runFilePaths,
          watchFilePaths,
          // require: ['test/support/env'],
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
  }


  // ###########################################################################
  // run
  // ###########################################################################

  /**
   * @param {Bug} bug 
   */
  async startWatchMode(bug) {
    // start webpack using latest node (long-time support)
    // make sure we have Dbux dependencies ready (since linkage might be screwed up in dev+install mode)
    const req = `-r "${this.manager.getDbuxPath('@dbux/cli/dist/linkOwnDependencies.js')}"`;
    const args = `--config ./dbux.webpack.config.js --watch --env entry=${bug.testFilePaths.join(',')}`;
    
    // weird bug - sometimes it just will keep saying "volta not found"... gotta hate system configuration problems...
    const volta = 'volta'; //'/Users/domi/.volta/bin/volta'; // 'volta';

    await this.execBackground(`which ${volta}`);
    // await this.execBackground(`echo $PATH`);
    
    return this.execBackground(
      `"${volta}" run --node 12 node ${req} "${this.getWebpackJs()}" ${args}`
    );
  }

  async testBugCommand(bug, cfg) {
    const { projectPath } = this;
    const bugArgs = this.getMochaRunArgs(bug, [
      '-t 10000' // timeout
    ]);
    const files = cfg.dbuxEnabled ? bug.watchFilePaths : bug.runFilePaths;
    const nodeVersion = this.getNodeVersion(bug);


    const mochaCfg = {
      cwd: projectPath,
      testArgs: `${bugArgs} ${files.join(' ')}`,
      require: [
        ...(bug.require || EmptyArray),
        this.manager.getDbuxPath(`@dbux/runtime/deps/require.ws.${nodeVersion}.js`)
      ],
      ...cfg
    };

    // TODO: actual location - `dist/tests/lib/rules/no-obj-calls.js`
    delete mochaCfg.dbuxJs; // dbux has already been infused -> run test without another dbux layer


    // return `cp ../../dbux-projects/assets/_shared_assets_/dbux.webpack.config.base.js dbux.webpack.config.base.js && \
    // node ../../node_modules/webpack/bin/webpack.js --config dbux.webpack.config.js && \
    // node --stack-trace-limit=100 -r @dbux/runtime/deps/require.ws.7.js  node_modules/mocha/bin/_mocha --no-exit -c -t 10000 --grep "" -- dist/tests/lib/rules/no-obj-calls.js`;

    return await buildMochaRunCommand(mochaCfg);
  }
}