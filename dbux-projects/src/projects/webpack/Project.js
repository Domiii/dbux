
/**
 * Steps to decipher example:
 *    cd examples/...
 *    Run w/ Dbux: `build.js`
 *    Find webpack-cli `node` command -> copy + paste -> modify -> run w/ Dbux
 * Run:
 *    cd examples/commonjs
 *    node "../../../../node_modules/@dbux/cli/bin/dbux.js" run --pw=webpack,webpack-cli --verbose=1 --runtime="{\"tracesDisabled\":1}" "../../bin/webpack.js" -- --mode none --env none --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js
 */

/**
 * TODO:
 * 1. add config file logic to `babel-plugin` (and make available through CLI)
 * 2. config: ignore large (/minified/certain) files
 */

import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';

/**
 * @see https://github.com/pandao/editor.md/blob/master/examples/full.html
 */
export default class WebpackProject extends Project {
  gitRemote = 'webpack/webpack.git';
  gitCommit = 'cde1b73';//'v5.31.2';

  packageManager = 'yarn';


  makeBuilder() {
    return new WebpackBuilder({
      inputPattern: 'lib/index.js'
    });
  }

  async afterInstall() {
    // https://github.com/webpack/webpack/blob/master/_SETUP.md
    await this.execInTerminal('yarn link && yarn link webpack');
    // NOTE: path.resolve(await this.execCaptureOut('readlink -f node_modules/webpack')) === path.resolve(this.projectPath)
    // await this.applyPatch('baseline');
    // await this.installWebpack4();
  }

  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/webpack/_patches_/error.patch

    return [
      {
        label: 'examples/commonjs',
        // patch: 'patch1',
        description: 'Basic commonjs Webpack example.',
        runArgs: []
        // bugLocations: [
        //   {
        //     file: 'src/controller.js',
        //     line: 65
        //   }
        // ]
      }
    ];
  }

  decorateBug(bug) {
    bug.mainEntryPoint = ['lib/index.js'];
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, debugPort) {
    
  }
}