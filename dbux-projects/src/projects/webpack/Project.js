import sh from 'shelljs';
import { gitCloneCmd } from '@dbux/common-node/src/util/gitUtil';
import { assertFileLinkTarget } from '@dbux/common-node/src/util/fileUtil';
import { pathJoin, pathResolve } from '@dbux/common-node/src/util/pathUtil';

import Project from '../../projectLib/Project';
// import WebpackBuilder from '../../buildTools/WebpackBuilder';
import { buildNodeCommand } from '../../util/nodeUtil';


export default class WebpackProject extends Project {
  gitRemote = 'webpack/webpack.git';
  gitCommit = 'cde1b73';//'v5.31.2';

  packageManager = 'yarn';

  // we don't want any commit hooks to get in the way
  rmFiles = ['.husky'];

  // makeBuilder() {
  //   // "node" "-r" "./dbux_projects/webpack/_dbux_/alias.build.js" "--stack-trace-limit=100" "./node_modules/webpack/bin/webpack.js" "--config" "./dbux_projects/webpack/dbux.webpack.config.js" "--env" "entry={\"bin/webpack\":\"bin//webpack.js\"}"
  //   // node --stack-trace-limit=100 ../../node_modules/@dbux/cli/bin/dbux.js run --pw=webpack,webpack-cli --verbose=1 --runtime="{\"tracesDisabled\":1}" -d -r=./_dbux_/alias.build.js ../../node_modules/webpack/bin/webpack.js -- --config ./dbux.webpack.config.js --env entry={"bin/webpack":"bin\\\\webpack.js"}
  //   // node --stack-trace-limit=100 -r ./_dbux_/alias.build.js ../../node_modules/webpack/bin/webpack.js -- --config ./dbux.webpack.config.js --env entry={"bin/webpack":"bin\\\\webpack.js"}
    
  //   return new WebpackBuilder({
  //     inputPattern: [
  //       'webpack/lib/index.js',
  //       'webpack-cli/packages/webpack-cli/bin/cli.js',
  //     ],

  //     nodeArgs: `-r "${pathJoin(this.projectPath, './_dbux_/alias.build.js')}"`,
  //     webpackCliBin: this.getSharedDependencyPath('webpack-cli/bin/cli.js'),
  //     processOptions: {
  //       cwd: this.getSharedDependencyPath('.')
  //     },
  //     env: {
  //       WEBPACK_CLI_SKIP_IMPORT_LOCAL: 1
  //     }
  //   });
  // }

  // ###########################################################################
  // install cli
  // ###########################################################################

  // makeBuilder() {
  //   return new WebpackBuilder({
  //     inputPattern: 'lib/index.js'
  //   });
  // }

  get cliFolder() {
    return pathResolve(this.projectPath, 'webpack-cli');
  }

  get cliPackageFolder() {
    return pathResolve(this.cliFolder, 'packages/webpack-cli');
  }

  get cliBin() {
    return pathResolve(this.cliPackageFolder, 'bin/cli.js');
  }

  get cliMain() {
    return pathResolve(this.cliPackageFolder, 'lib/index.js');
  }

  get cliLinkedTarget() {
    return pathJoin(this.projectPath, 'node_modules/webpack-cli');
  }

  async checkCliInstallation(shouldError = true) {
    const { cliLinkedTarget, cliPackageFolder, projectPath } = this;
    return (
      await assertFileLinkTarget(
        pathJoin(this.projectPath, 'node_modules/webpack'),
        projectPath,
        shouldError
      ) &&
      await assertFileLinkTarget(cliLinkedTarget, cliPackageFolder, shouldError)
    );
  }

  async installWebpackCli() {
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

    const linkFolder = pathResolve(projectPath, '../_links_');
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

    await this.installWebpackCli();

    // see https://github.com/webpack/webpack-cli/releases/tag/webpack-cli%404.6.0
    // NOTE: pathResolve(await this.execCaptureOut('readlink -f node_modules/webpack')) === pathResolve(this.projectPath)
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
    bug.mainEntryPoint = [this.cliBin];
  }

  async testBugCommand(bug, cfg) {
    const { projectPath } = this;

    /**
     * getProjectPath
     */
    function p(...f) {
      return pathResolve(projectPath, ...f);
    }

    return [
      buildNodeCommand({
        ...cfg,

        // nodeArgs: `${cfg.nodeArgs} --max-old-space-size=8192`,
        nodeArgs: `${cfg.nodeArgs} --max-old-space-size=16384`,

        // NOTE: when changing paths, make sure that `alias.runtime` refers to the correct paths as well
        program: p(this.cliBin),
        require: p('_dbux_/alias.runtime.js'),
        // dbuxArgs: `${cfg.dbuxArgs} --pw=tapable,graceful-fs,enhanced-resolve`, // --pw=tapable`, // --pw=.*`,
        dbuxArgs: `${cfg.dbuxArgs} --pw=tapable`,
        // dbuxArgs: '--pw=webpack,webpack-cli --verbose=1 --runtime="{\\"tracesDisabled\\":1}"',

        /**
         * TODO: --stats-reasons --stats-used-exports --stats-provided-exports --stats-chunks --stats-modules-space 99999 --stats-chunk-origins
         * @see https://webpack.js.org/configuration/stats/#statsreasons
         */
        // eslint-disable-next-line max-len
        // programArgs: '--mode none --env none --no-stats-colors --output-public-path "dist/"  --entry ./example.js --output-path output.js'
        programArgs: '--mode none --env none --entry ./example.js --output-path output.js'
      }),
      {
        env: {
          WEBPACK_CLI_SKIP_IMPORT_LOCAL: 1
        },
      }
    ];
  }
}