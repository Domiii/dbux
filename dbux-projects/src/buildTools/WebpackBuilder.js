import path from 'path';
// import glob from 'glob';
import isFunction from 'lodash/isFunction';
import { filesToEntry, getWebpackJs, getWebpackDevServerJs, serializeEnv } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';

export default class WebpackBuilder {
  constructor(cfg) {
    this.cfg = cfg;
  }

  async afterInstall() {
    await this.project.installWebpack4();
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

    let value = project[name];
    if (isFunction(value)) {
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
    bug.watchFilePaths = bug.watchFilePaths || await this.getValue(bug, 'watch') || inputFiles.map(file => path.resolve(projectPath, 'dist', file));

    if (websitePort) {
      // website settings
      bug.websitePort = websitePort;
      bug.website = `http://localhost:${websitePort}${bug.websitePath || '/'}`;
    }
  }

  getWebpackDevServerJs() {
    // return this.project.getDependencyPath(getWebpackDevServerJs());
    return path.join('node_modules', getWebpackDevServerJs());
  }

  getWebpackJs() {
    // return this.project.getDependencyPath(getWebpackJs());
    return path.join('node_modules', getWebpackJs());
  }

  webpackBin(serve = false) {
    return this.cfg.webpackBin || (serve ? this.getWebpackDevServerJs() : this.getWebpackJs());
  }

  async startWatchMode(bug) {
    const { project, cfg } = this;

    // start webpack
    let entry = await this.getValue(bug, 'entry');
    if (!entry) {
      entry = filesToEntry(bug.inputFiles, cfg.rootPath);
    }
    const env = serializeEnv({
      entry,
      port: bug.websitePort || 0
    });

    const webpackBin = this.webpackBin(!!bug.websitePort);
    let cmd = `node ${webpackBin} --display-error-details --watch --config ./dbux.webpack.config.js ${env}`;
    return project.execBackground(cmd);
  }
}