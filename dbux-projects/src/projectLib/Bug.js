import isEqual from 'lodash/isEqual';
import path from 'path';

/** @typedef {import('./Project').default} Project */
/** @typedef {import('../ProjectsManager').default} PracticeManager */

export default class Bug {
  /**
   * @type {Project}
   */
  project;

  /**
   * Not used too much.
   * If given, we used this to opens the first of these files in editor.
   * But that is now replaced by `mainEntryPoint`
   */
  testFilePaths;

  /**
   * File to open in editor, if exists
   */
  mainEntryPoint;

  /**
   * If given, are passed as input files to bug runner.
   */
  runFilePaths;

  /**
   * If given, `startWatchMode` will wait for these files to exist before continuing.
   */
  watchFilePaths;

  /**
   * Either all bugs have an assigned an id, or none do (and id will be auto-assigned by project)
   */
  id;
  title;
  description;

  /**
   * [Optional] file name of patch inside of `_patches_` folder to be applied to activate bug
   */
  patch;

  /**
   * Can be used to provide even more information about the bug.
   * E.g. BugsJs provides discussion logs of developers revolving around the bug.
   */
  moreDetails;

  hints; // TODO
  difficulty; // TODO!

  /**
   * @type {[Object]}
   */
  bugLocations;

  constructor(project, cfg) {
    Object.assign(this, cfg);
    this.project = project;
  }

  get debugTag() {
    return `${this.project} (bug #${this.id})`;
  }

  /**
   * @return {PracticeManager}
   */
  get manager() {
    return this.project.manager;
  }

  get runStatus() {
    return this.manager.getBugRunStatus(this);
  }

  async openInEditor() {
    // open file (if any)
    let targetFile = this.mainEntryPoint || this.testFilePaths;
    if (Array.isArray(targetFile)) {
      [targetFile] = targetFile;
    }
    if (targetFile) {
      const fpath = path.join(this.project.projectPath, targetFile);
      await this.manager.externals.editor.openFile(fpath);
    }
  }

  isCorrectBugLocation(loc) {
    const { projectPath } = this.project;

    if (!this.bugLocations) {
      return null;
    }

    const expandedBugLocations = this.bugLocations.flatMap(bl => {
      if (Array.isArray(bl.line)) {
        // line can be an array
        return bl.line.map(l => ({
          file: bl.file,
          line: l
        }));
      }
      return bl;
    });

    return expandedBugLocations.some(t => {
      return isEqual({
        fileName: path.join(projectPath, t.fileName || t.file),
        line: t.line,
      }, loc);
    });
  }
}