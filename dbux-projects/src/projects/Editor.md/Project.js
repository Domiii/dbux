import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';

/**
 * @see https://github.com/pandao/editor.md/blob/master/examples/full.html
 */
export default class EditorMdProject extends Project {
  gitRemote = 'pandao/editor.md.git';
  gitCommit = '63786e6';


  makeBuilder() {
    // node node_modules\webpack\bin\webpack.js --watch=false --config ./dbux.webpack.config.js --env port=3244 --env entry="{ \"editormd\": \"src/editormd.js\" }"
    return new WebpackBuilder({
      websitePort: 3844,
      rootPath: 'src',
      inputPattern: '*'
    });
  }

  async afterInstall() {
    await this.installWebpack4();
  }

  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/2048/_patches_/error.patch

    return [
      {
        label: 'Full',
        // patch: 'patch1',
        description: 'Basic example of Editor.md',
        runArgs: [],
        websitePath: '/examples/full.html'
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
    bug.mainEntryPoint = ['src/editormd.js'];
  }

  async selectBug(bug) {
    return this.switchToBugPatchTag(bug);
  }

  async testBugCommand(bug, cfg) {
    // nothing to do
  }
}