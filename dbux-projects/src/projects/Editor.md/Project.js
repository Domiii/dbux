import Project from '../../projectLib/Project';
import WebpackBuilder from '../../buildTools/WebpackBuilder';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */

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

  decorateExercise(config) {
    config.mainEntryPoint = ['src/editormd.js'];
    return config;
  }

  async runCommand(bug, cfg) {
    // nothing to do
  }
}