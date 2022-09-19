import path from 'path';
import sh from 'shelljs';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import Project from '../../projectLib/Project';
import { buildMochaRunCommand } from '../../util/mochaUtil';
import { DefaultNodeVersion } from '../../checkSystem';

/** @typedef {import('../../projectLib/Exercise').default} Bug */
/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

export default class EslintProject extends Project {
  gitRemote = 'BugsJS/eslint.git';

  packageManager = 'npm';

  // TODO: get nodeVersion by bug instead
  nodeVersion = '7';

  async installDependencies() {
    throw new Error(`TODO: don't use webpack (or use WebpackBuilder if webpack is preferrable)`);
    // // TODO: install Babel plugins in dev mode, if not present
    // const webpackJs = this.getWebpackJs();
    // if (!sh.test('-f', webpackJs)) {
    //   await this.execInTerminal(`"${npm}" i -D webpack@4.41.5 webpack-cli@3.3.10 webpack-node-externals@2.5.0 string-replace-loader@2.3.0`);
    // }

    // // add "dist" folder to gitignore
    // await this.exec('bash -c "echo ""dist"" >> .gitignore"');
  }

  canRunExercise(config) {
    return !!config.testFilePaths;
  }

  decorateExercise(config) {
    const runFilePaths = config.testFilePaths;
    let watchFilePaths = config.testFilePaths.map(file => path.join(this.projectPath, 'dist', file));

    const tagCategory = "test"; // "test", "fix" or "full"

    return {
      description: config.testRe,
      runArgs: [
        '--grep',
        `"${config.testRe}"`,
        '--',
        // ...watchFilePaths,
        // eslint-disable-next-line max-len
        // 'tests/lib/rules/**/*.js tests/lib/*.js tests/templates/*.js tests/bin/**/*.js tests/lib/code-path-analysis/**/*.js tests/lib/config/**/*.js tests/lib/formatters/**/*.js tests/lib/internal-rules/**/*.js tests/lib/testers/**/*.js tests/lib/util/**/*.js'
      ],
      runFilePaths,
      watchFilePaths,
      tag: this._getExerciseGitTag(config.id, tagCategory),
      // require: ['test/support/env'],
      ...config,
      // testFilePaths: bug.testFilePaths.map(p => `./${p}`)
    };
  }

  _getExerciseGitTag(exerciseNumber, tagCategory) {
    return `Bug-${exerciseNumber}-${tagCategory}`;
  }


  // ###########################################################################
  // run
  // ###########################################################################

  /**
   * @param {Exercise} exercise 
   */
  async startWatchMode(exercise) {
    // start webpack using latest node (long-time support)
    // make sure we have Dbux dependencies ready (since linkage might be screwed up in dev+install mode)
    const req = `-r "${this.manager.getDbuxPath('@dbux/cli/dist/linkOwnDependencies.js')}"`;
    const args = `--config ./dbux.webpack.config.js --env entry=${exercise.testFilePaths.join(',')}`;
    const cmd = `${req} "${this.getWebpackJs()}" ${args}`;
    // cmd = makeNodeAtVersionCommand(12, cmd);
    return this.execBackground(cmd);
  }

  async runCommand(exercise, cfg) {
    const { projectPath } = this;
    const bugArgs = this.getMochaRunArgs(exercise, [
      '-t 10000' // timeout
    ]);
    const files = cfg.dbuxEnabled ? exercise.watchFilePaths : exercise.runFilePaths;
    const nodeVersion = this.getCustomNodeVersion(exercise) || DefaultNodeVersion;

    const mochaCfg = {
      cwd: projectPath,
      testArgs: `${bugArgs} ${files.join(' ')}`,
      require: [
        ...(exercise.require || EmptyArray),
        this.manager.getDbuxPath(`@dbux/runtime/deps/require.ws.${nodeVersion}.js`)
      ],
      ...cfg
    };

    delete mochaCfg.dbuxJs; // dbux has already been infused -> run test without another dbux layer


    // return `cp ../../dbux-projects/assets/_shared_assets_/dbux.webpack.config.base.js dbux.webpack.config.base.js && \
    // node ../../node_modules/webpack/bin/webpack.js --config dbux.webpack.config.js && \
    // node --stack-trace-limit=100 -r @dbux/runtime/deps/require.ws.7.js  node_modules/mocha/bin/_mocha --no-exit -c -t 10000 --grep "" -- dist/tests/lib/rules/no-obj-calls.js`;

    return await buildMochaRunCommand(mochaCfg);
  }
}