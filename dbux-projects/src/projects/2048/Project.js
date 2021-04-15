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
    // await this.autoCommit(); // NOTE: autoCommit is called right after this method
    // await this.installPackages(`webpack-dev-server@3.11.0`);
  }

  getAllJsFiles() {
    // return getAllFilesInFolders(path.join(this.projectPath, folder));
    // return globToEntry(this.projectPath, 'js/*');
    return globRelative(this.projectPath, 'js/*');
  }

  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/2048/_patches_/error.patch

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
      {
        label: 'Error when starting',
        description: 'Game does not start. An error is reported.',
        patch: 'error1',
        bugLocations: [
          {
            file: 'js/html_actuator.js',
            line: 82
          }
        ]
      },
      {
        label: 'Right arrow button does not work anymore.',
        description: 'You can still use D to move right, but the right arrow button does not work.',
        patch: 'error2',
        bugLocations: [
          {
            file: 'js/keyboard_input_manager.js',
            line: Array.from({ length: 50 - 38 }, (_, i) => i + 38)
          }
        ]
      },
      {
        label: 'The reset key is now Q. But it should be R.',
        description: 'Usually, if you press R, the game resets. But that does not work anymore. It uses Q instead. But we want R!',
        patch: 'error3',
        bugLocations: [
          {
            file: 'js/keyboard_input_manager.js',
            line: 66
          }
        ]
      },
      {
        label: '',
        description: '',
        patch: 'error4',
        bugLocations: [
          {
            file: 'js/.js',
            line: 0
          }
        ]
      }
    ].map((bug) => {
      bug.port = this.port;
      bug.website = `http://localhost:${this.port}`;

      bug.mainEntryPoint = ['js/application.js'];

      return bug;
    });
  }

  async selectBug(bug) {
    this.updateBugFiles(bug);
    return this.switchToBugPatchTag(bug);
  }

  /**
   * NOTE: this is separate from `loadBugs` because `loadBugs` might be called before the project has been downloaded.
   * This function however is called after download, so we can make sure that `getAllJsFiles` actually gets the files.
   */
  updateBugFiles(bug) {
    if (!this.inputFiles) {
      this.inputFiles = this.getAllJsFiles();
    }

    // bug.runFilePaths = bug.testFilePaths;
    bug.inputFiles = this.inputFiles;
    bug.watchFilePaths = this.inputFiles.map(file => path.resolve(this.projectPath, 'dist', file));
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

  async testBugCommand(bug, debugPort) {
    // nothing to do yet
    // TODO: run tests?
  }
}