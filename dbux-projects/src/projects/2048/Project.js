import path from 'path';
// import glob from 'glob';
import { filesToEntry, serializeEnv } from '@dbux/common-node/src/util/webpackUtil';
import { globRelative } from '@dbux/common-node/src/util/fileUtil';
import Project from '../../projectLib/Project';
// import { getAllFilesInFolders } from '../../util/fileUtil';


export default class _2048Project extends Project {
  gitRemote = 'gabrielecirulli/2048.git';
  gitCommit = 'fc1ef4f';
  port = 3843;

  async afterInstall() {
    // NOTE: we need to expose all globals manually, since there is no easy way to workaround that problem with Webpack
    await this.applyPatch('baseline');
    await this.autoCommit();
    // await this.installPackages(`webpack-dev-server@3.11.0`);
  }

  getAllJsFiles() {
    // return getAllFilesInFolders(path.join(this.projectPath, folder));
    // return globToEntry(this.projectPath, 'js/*');
    return globRelative(this.projectPath, 'js/*');
  }

  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/2048/_patches_/patch1.patch
    this.inputFiles = this.getAllJsFiles();

    return [
      {
        label: 'baseline',
        // patch: 'patch1',
        description: 'The original game',
        runArgs: [],
        // bugLocations: [
        //   {
        //     file: 'src/controller.js',
        //     line: 65
        //   }
        // ]
      },
    ].map((bug) => {
      bug.port = this.port;
      bug.website = `http://localhost:${this.port}`;

      bug.mainEntryPoint = ['js/application.js'];
      // bug.runFilePaths = bug.testFilePaths;
      bug.inputFiles = this.inputFiles;
      bug.watchFilePaths = this.inputFiles.map(file => path.resolve(this.projectPath, 'dist', file));

      return bug;
    });
  }

  async startWatchMode(bug) {
    // start webpack
    const entry = filesToEntry(bug.inputFiles);
    const env = serializeEnv({
      entry,
      port: bug.port
    });
    let cmd = `node ${this.getWebpackDevServerJs()} --display-error-details --watch --config ./dbux.webpack.config.js ${env}`;
    return this.execBackground(cmd);
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, debugPort) {
    // nothing to do yet
    // TODO: run tests?
  }
}