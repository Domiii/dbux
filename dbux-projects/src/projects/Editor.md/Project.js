import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';

/** @typedef {import('../../projectLib/BugConfig').default} BugConfig */

/**
 * Debug
 *
// dbux disable
console.warn(`cmUnbindScroll ${__dbux__._r._runtime.peekCurrentContextId()}`);
 */

/**
 * Editor.md examples need a bit of extra work:
 * 1. move to from `examples/` to `dbux-examples/`
 * 2. extract all example JS code from *.html to *.js (since we haven't setup `html-loader` yet)
 * 3. make changes to html and js file paths: only refer to files in `examples` via absolute path
 * 
 * future-work: integrate html-loader with dbux-project webpack build process.
 * 
 * @see https://github.com/pandao/editor.md/blob/masterexamples/full.html
 */
export default class EditorMdProject extends Project {
  gitRemote = 'pandao/editor.md.git';
  gitCommit = '63786e6';


  makeBuilder() {
    // node node_modules\webpack\bin\webpack.js --watch=false --config ./dbux.webpack.config.js --env port=3244 --env entry="{ \"editormd\": \"src/editormd.js\" }"
    return new WebpackBuilder({
      websitePort: 3844,
      // entryPattern: [['src', '*'], 'dbux-examples/*.js'],
      entryPattern: ['dbux-examples/*.js'],
      copy: ['examples', 'css', 'lib', 'fonts', 'images', 'languages', 'dbux-examples/*.html']
    });
  }

  async afterInstall() {
    await this.applyPatch('baseline');
  }

  /**
   * @return {BugConfig[]}
   */
  loadBugs() {
    // git diff --color=never --ignore-cr-at-eol > ../../dbux-projects/assets/_patches_/Editor.md/baseline.patch | unix2dos

    return [
      {
        label: 'full',
        // patch: 'patch1',
        description: 'Basic example of Editor.md',
        runArgs: [],
        /**
         * future-work: use `html-loader` to automatically transform the html file instead
         * @see https://webpack.js.org/loaders/html-loader/
         */
        websitePath: 'dbux-examples/full.html',
        // websitePath: 'examples/full.html'
        // bugLocations: [
        //   {
        //     file: 'src/controller.js',
        //     line: 65
        //   }
        // ]
      },
      {
        label: 'full-onload',
        patch: 'onload',
        description: 'Basic example of Editor.md (with loadCSS + loadScript ACG nodes connected)',
        runArgs: [],
        /**
         * future-work: use `html-loader` to automatically transform the html file instead
         * @see https://webpack.js.org/loaders/html-loader/
         */
        websitePath: 'dbux-examples/full.html',
        // websitePath: 'examples/full.html'
        // bugLocations: [
        //   {
        //     file: 'src/controller.js',
        //     line: 65
        //   }
        // ]
      }
    ];
  }

  decorateBugForRun(bug) {
    bug.mainEntryPoint = ['src/editormd.js'];
  }

  async testBugCommand(bug, cfg) {
    // nothing to do
  }
}