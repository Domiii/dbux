import path from 'path';
import sh from 'shelljs';
import { gitCloneCmd } from '@dbux/common-node/src/util/gitUtil';
import { assertFileLinkTarget } from '@dbux/common-node/src/util/fileUtil';

import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import { buildNodeCommand } from '../../util/nodeUtil';


export default class WebpackProject extends Project {
  gitRemote = 'webpack/webpack.git';
  gitCommit = 'cde1b73';//'v5.31.2';

  packageManager = 'yarn';

  // we don't want any commit hooks to get in the way
  rmFiles = ['.husky'];

  makeBuilder() {
    // "node" "-r" "./dbux_projects/webpack/_dbux_/alias.js" "--stack-trace-limit=100" "./node_modules/webpack/bin/webpack.js" "--display-error-details" "--watch" "--config" "./dbux_projects/webpack/dbux.webpack.config.js" "--env" "entry={\"bin/webpack\":\"bin//webpack.js\"}"

    // node --stack-trace-limit=100 ../../node_modules/@dbux/cli/bin/dbux.js run --pw=webpack,webpack-cli --verbose=1 --runtime="{\"tracesDisabled\":1}" -d -r=./_dbux_/alias.js ../../node_modules/webpack/bin/webpack.js -- --display-error-details --watch --config ./dbux.webpack.config.js --env entry={"bin/webpack":"bin\\\\webpack.js"}

    // node --stack-trace-limit=100 -r ./_dbux_/alias.js ../../node_modules/webpack/bin/webpack.js -- --display-error-details --watch --config ./dbux.webpack.config.js --env entry={"bin/webpack":"bin\\\\webpack.js"}
    return new WebpackBuilder({
      inputPattern: 'bin/webpack.js',
      
      nodeArgs: `-r "${path.join(this.projectPath, './_dbux_/alias.js')}"`,
      webpackBin: this.getDependencyPath('webpack/bin/webpack.js'),
      processOptions: {
        cwd: this.getDependencyPath('.')
      }
    });
  }

  // ###########################################################################
  // install cli
  // ###########################################################################

  // makeBuilder() {
  //   return new WebpackBuilder({
  //     inputPattern: 'lib/index.js'
  //   });
  // }

  get cliFolder() {
    return path.resolve(this.projectPath, 'webpack-cli');
  }

  get cliPackageFolder() {
    return path.resolve(this.projectPath, 'webpack-cli/packages/webpack-cli');
  }

  get cliLinkedTarget() {
    return path.join(this.projectPath, 'node_modules/webpack-cli');
  }

  async checkCliInstallation(shouldError = true) {
    const { cliLinkedTarget, cliPackageFolder, projectPath } = this;
    return (
      await assertFileLinkTarget(
        path.join(this.projectPath, 'node_modules/webpack'),
        projectPath,
        shouldError
      ) &&
      await assertFileLinkTarget(cliLinkedTarget, cliPackageFolder, shouldError)
    );
  }

  async verifyInstallation() {
    if (await this.checkCliInstallation(false)) {
      return;
    }

    // make sure, webpack-cli did not get accidentally installed
    sh.rm('-rf', this.cliLinkedTarget);

    const { cliFolder, cliPackageFolder, projectPath } = this;

    // clone, install and link webpack-cli
    await this.execInTerminal(
      gitCloneCmd(
        'https://github.com/webpack/webpack-cli.git',
        'refs/tags/webpack-cli@4.6.0',
        cliFolder
      ),
      { cwd: cliFolder }
    );

    // NOTE: global folder on Windows is ~/AppData/Local/Yarn/Data/link, other: /.config/yarn/link/${packageName} (see https://github.com/dominicfallows/manage-linked-packages/blob/master/src/helpers/getPath.ts)

    const linkFolder = path.resolve(projectPath, '../_links_');
    sh.mkdir('-p', linkFolder);
    await this.execInTerminal(
      `yarn install`,
      { cwd: cliPackageFolder }
    );
    await this.execCaptureOut(
      `yarn link --link-folder ${linkFolder}`,
      { cwd: cliPackageFolder }
    );
    await this.execCaptureOut(
      `yarn link --link-folder ${linkFolder} webpack-cli`,
      { cwd: projectPath }
    );

    // make sure, things are linked correctly
    await this.checkCliInstallation();
  }

  async afterInstall() {
    // https://github.com/webpack/webpack/blob/master/_SETUP.md
    await this.execInTerminal('yarn link && yarn link webpack');

    await this.installPackages('shebang-loader');

    // see https://github.com/webpack/webpack-cli/releases/tag/webpack-cli%404.6.0
    // NOTE: path.resolve(await this.execCaptureOut('readlink -f node_modules/webpack')) === path.resolve(this.projectPath)
    // await this.applyPatch('baseline');
    // await this.installWebpack4();
  }


  // ###########################################################################
  // loadBugs
  // ###########################################################################

  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/webpack/_patches_/error.patch

    return [
      /**
      cd examples/commonjs
      node "../../../../node_modules/@dbux/cli/bin/dbux.js" run --pw=webpack,webpack-cli --verbose=1 --runtime="{\"tracesDisabled\":1}" "../../bin/webpack.js" -- --mode none --env none --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js
       */
      {
        label: 'examples/commonjs',
        cwd: 'examples/commonjs',
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

  // ###########################################################################
  // testing
  // ###########################################################################

  decorateBug(bug) {
    bug.mainEntryPoint = ['lib/index.js'];
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, cfg) {
    return buildNodeCommand({
      ...cfg,
      dbuxArgs: '--pw=webpack,webpack-cli --verbose=1 --runtime="{\\"tracesDisabled\\":1}"',
      program: '../../dist/bin/webpack.js',
      // eslint-disable-next-line max-len
      programArgs: '--mode none --env none --stats-reasons --stats-used-exports --stats-provided-exports --no-stats-colors --stats-chunks  --stats-modules-space 99999 --stats-chunk-origins --output-public-path "dist/"  --entry ./example.js --output-filename output.js'
    });
  }
}