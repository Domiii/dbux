import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
// import { getAllFilesInFolders } from '../../util/fileUtil';


export default class _2048Project extends Project {
  gitRemote = 'gabrielecirulli/2048.git';
  gitCommit = 'fc1ef4f';

  makeBuilder() {
    return new WebpackBuilder({
      websitePort: 3843,
      inputPattern: 'js/*'
    });
  }

  async afterInstall() {
    // NOTE: we need to expose all globals manually, since there is no easy way to workaround that problem with Webpack
    await this.applyPatch('baseline');

    await this.execInTerminal('npm init -y');

    await this.installWebpack4();
    // await this.autoCommit(); // NOTE: autoCommit is called right after this method
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
      // {
      //   label: '',
      //   description: '',
      //   patch: 'error4',
      //   bugLocations: [
      //     {
      //       file: 'js/.js',
      //       line: 0
      //     }
      //   ]
      // }
    ];
  }

  decorateBug(bug) {
    bug.mainEntryPoint = ['js/application.js'];
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, debugPort) {
    // nothing to do
  }
}