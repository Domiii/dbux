import path from 'path';
// import glob from 'glob';
import { filesToEntry, getWebpackDevServerJs, serializeEnv } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';

export default class WebpackBuilder {
  constructor(cfg) {
    this.cfg = cfg;
  }

  initProject(project) {
    this.project = project;
  }

  getJsRoot() {
    const { project, cfg } = this;
    return path.join(project.projectPath, cfg.rootPath || '');
  }

  getAllJsFiles() {
    // return getAllFilesInFolders(path.join(this.projectPath, folder));
    // return globToEntry(this.projectPath, 'js/*');
    const { cfg } = this;
    return globRelative(this.getJsRoot(), cfg.jsFilePatterns);
  }

  /**
   * NOTE: this is separate from `loadBugs` because `loadBugs` might be called before the project has been downloaded.
   * This function however is called after download, so we can make sure that `getAllJsFiles` actually gets the files.
   */
  decorateBug(bug) {
    if (!this.inputFiles) {
      this.inputFiles = this.getAllJsFiles();
    }
    const {
      project: { projectPath },
      cfg: { websitePort },
      inputFiles
    } = this;

    // bug.runFilePaths = bug.testFilePaths;
    bug.inputFiles = inputFiles;
    bug.watchFilePaths = inputFiles.map(file => path.resolve(projectPath, 'dist', file));

    // website settings
    bug.websitePort = websitePort;
    bug.website = `http://localhost:${websitePort}${bug.websitePath || '/'}`;
  }

  async startWatchMode(bug) {
    const { project, cfg } = this;

    // start webpack
    const entry = filesToEntry(bug.inputFiles, cfg.rootPath);
    const env = serializeEnv({
      entry,
      port: bug.websitePort
    });
    let cmd = `node ${getWebpackDevServerJs()} --display-error-details --watch --config ./dbux.webpack.config.js ${env}`;
    return project.execBackground(cmd);
  }
}