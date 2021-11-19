import path from 'path';
import sh from 'shelljs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

export default class KarmaProject extends Project {
  gitRemote = 'BugsJS/karma.git';

  packageManager = 'npm';

  // TODO: support different node version per bug
  nodeVersion = '5';


  async installDependencies() {
    // TODO: install Babel plugins in dev mode, if not present
    const webpackJs = this.getWebpackJs();
    if (!sh.test('-f', webpackJs)) {
      await this.execInTerminal(`npm i -D webpack@4.41.5 webpack-cli@3.3.10 webpack-node-externals@2.5.0 string-replace-loader@2.3.0`);
    }

    // add "dist" folder to gitignore
    await this.exec('bash -c "echo ""dist"" >> .gitignore"');
  }

  canRun(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    return {
      // id: i + 1,
      name: `bug #${config.id}`,
      description: config.testRe,
      runArgs: [
        '--grep',
        `"${config.testRe}"`,
        '--',
        ...config.testFilePaths.map(file => path.join('dist', file)),
        // eslint-disable-next-line max-len
        // 'tests/lib/rules/**/*.js tests/lib/*.js tests/templates/*.js tests/bin/**/*.js tests/lib/code-path-analysis/**/*.js tests/lib/config/**/*.js tests/lib/formatters/**/*.js tests/lib/internal-rules/**/*.js tests/lib/testers/**/*.js tests/lib/util/**/*.js'
      ],
      // require: ['test/support/env'],
      ...config,
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
    };
  }

  getExerciseGitTag(exerciseId, tagCategory) {
    return `Bug-${exerciseId}-${tagCategory}`;
  }

  async selectExercise(exercise) {
    const {
      id, name
    } = exercise;
    const tagCategory = "test"; // "test", "fix" or "full"
    const tag = this.getExerciseGitTag(id, tagCategory);

    if ((await this.gitGetCurrentTagName()).startsWith(tag)) {
      // do not checkout bug, if we already on the right tag
      return;
    }

    // checkout the bug branch
    sh.cd(this.projectPath);
    this.log(`Checking out bug ${name || id}...`);

    // see: https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt-emgitcheckoutem-b-Bltnewbranchgtltstartpointgt
    await this.exec(`${this.gitCommand} checkout -B ${tag} tags/${tag}`);
  }


  // ###########################################################################
  // run
  // ###########################################################################

  getWebpackJs() {
    return this.manager.getDbuxPath('webpack/bin/webpack.js');
  }

  async startWatchMode() {
    // start webpack using latest node (long-time support)
    // make sure we have Dbux dependencies ready (since linkage might be screwed up in dev+install mode)
    const req = `-r ${this.manager.getDbuxPath('@dbux/cli/dist/linkOwnDependencies.js')}`;
    const args = '--config ./dbux.webpack.config.js --watch';
    return this.execBackground(
      `volta run --node lts node ${req} ${this.getWebpackJs()} ${args}`
    );
  }

  async runCommand(exercise, cfg) {
    const { projectPath } = this;
    const testArgs = this.getMochaRunArgs(exercise, [
      '-t 10000' // timeout
    ]);

    const { nodeVersion } = this; // TODO

    const mochaCfg = {
      cwd: projectPath,
      testArgs,
      require: [
        ...(exercise.require || EmptyArray),
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