import isEqual from 'lodash/isEqual';
import path from 'path';

/** @typedef {import('./Project').default} Project */
/** @typedef {import('../ProjectsManager').default} PracticeManager */

export default class Bug {
  /**
   * @type {Project}
   */
  project;

  testFilePaths;
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
    if (this.testFilePaths?.[0]) {
      const fpath = path.join(this.project.projectPath, this.testFilePaths[0]);
      await this.manager.externals.editor.openFile(fpath);
    }
  }

  isCorrectBugLocation(loc) {
    const { projectPath } = this.project;

    if (!this.bugLocations) {
      return null;
    }

    return this.bugLocations.some(t => {
      return isEqual({
        fileName: path.join(projectPath, t.fileName),
        line: t.line,
      }, loc);
    });
  }
}