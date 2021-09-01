import path from 'path';
// import glob from 'glob';
import isFunction from 'lodash/isFunction';
import { filesToEntry, getWebpackJs, getWebpackDevServerJs, serializeEnv } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';

/** @typedef { import("../projectLib/Project").default } Project */

export default class WebpackBuilder {
  /**
   * @type {Project}
   */
  project;

  constructor(cfg) {
    this.cfg = cfg;
  }

  get needsDevServer() {
    const {
      cfg: { websitePort },
    } = this;
    return !!websitePort;
  }

  /**
   * WebpackBuilder already instruments and injects dbux.
   * `testBugCommand` should not use @dbux/cli.
   */
  get needsDbuxCli() {
    return false;
  }

  async afterInstall() {
    const shared = true;
    const deps = {
      // eslint-disable-next-line quote-props
      'webpack': '^5',
      'webpack-cli': '^4',
      // 'webpack-config-utils': '???',
      // 'copy-webpack-plugin': '^8'
    };
    if (this.needsDevServer) {
      deps['webpack-dev-server'] = '^3';
    }
    await this.project.installPackages(deps, shared);
  }

  initProject(project) {
    this.project = project;
  }

  getJsRoot() {
    const { project, cfg } = this;
    return path.join(project.projectPath, cfg.rootPath || '');
  }

  getInputFiles() {
    // return getAllFilesInFolders(path.join(this.projectPath, folder));
    // return globToEntry(this.projectPath, 'js/*');
    const { cfg } = this;
    const root = this.getJsRoot();
    let inputFiles;
    if (cfg.inputPattern) {
      inputFiles = globRelative(root, cfg.inputPattern);
      if (!inputFiles?.length) {
        throw new Error(`inputPattern missing or invalid (no input files found): ${cfg.inputPattern}`);
      }
    }
    return inputFiles;
  }

  async getValue(bug, name) {
    const { project } = this;

    let value = bug[name] || project[name];
    if (isFunction(value)) {
      // this === project, first arg = bug
      value = await value.call(project, bug);
    }
    return value;
  }

  /**
   * NOTE: this is separate from `loadBugs` because `loadBugs` might be called before the project has been downloaded.
   * This function however is called after download, so we can make sure that `getInputFiles` actually gets the files.
   */
  async decorateBug(bug) {
    if (!this.inputFiles) {
      this.inputFiles = this.getInputFiles();
    }
    const {
      project: { projectPath },
      cfg: { websitePort },
      inputFiles
    } = this;

    bug.inputFiles = bug.inputFiles || inputFiles;

    // bug.runFilePaths = bug.testFilePaths;
    bug.watchFilePaths = await this.getValue(bug, 'watchFilePaths') ||
      inputFiles.map(file => path.resolve(projectPath, 'dist', file));

    if (websitePort) {
      // website settings
      bug.websitePort = websitePort;
      bug.website = `http://localhost:${websitePort}${bug.websitePath || '/'}`;
    }
  }

  // getWebpackDevServerJs() {
  //   // return this.project.getSharedDependencyPath(getWebpackDevServerJs());
  //   return path.join('node_modules', getWebpackDevServerJs());
  // }

  // getWebpackJs() {
  //   // return this.project.getSharedDependencyPath(getWebpackJs());
  //   return path.join('node_modules', getWebpackJs());
  // }

  webpackCliCommand() {
    return this.needsDevServer ? 'serve' : 'watch';
  }

  webpackCliBin() {
    // return this.cfg.webpackCliBin || (this.needsDevServer ? this.getWebpackDevServerJs() : this.getWebpackJs());
    return this.project.getSharedDependencyPath('webpack-cli/bin/cli.js');
  }

  async startWatchMode(bug) {
    const { project, cfg } = this;
    const { projectPath } = project;

    const {
      nodeArgs = '',
      processOptions,
      env: moreEnv = {}
    } = cfg;

    // start webpack
    let entry = await this.getValue(bug, 'entry');
    if (!entry) {
      entry = filesToEntry(bug.inputFiles, cfg.rootPath);
    }
    const env = serializeEnv({
      // TODO: add dbuxArgs
      ...moreEnv,
      entry,
      port: bug.websitePort || 0
    });

    const webpackConfig = path.join(projectPath, 'dbux.webpack.config.js');
    const webpackArgs = `--config ${webpackConfig} ${env}`;

    const webpackCliBin = this.webpackCliBin();
    const webpackCliCommand = this.webpackCliCommand();
    let cmd = `node ${nodeArgs} --stack-trace-limit=100 ${webpackCliBin} ${webpackCliCommand} ${webpackArgs}`;
    
    // TODO: find better solution for this
    cmd = cmd.replace(/\\/g, '/');

    return project.execBackground(cmd, processOptions);
  }
}