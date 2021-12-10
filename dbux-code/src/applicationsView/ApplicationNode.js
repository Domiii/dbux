import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNode from '../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

export default class ProjectNode extends BaseTreeViewNode {
  /**
   * @param {Application} app
   */
  static makeLabel(app) {
    const prefix = allApplications.selection.containsApplication(app) ? '☑' : '☐';
    // const label = app.getRelativeFolder();
    const label = app.getPreferredName();
    return `${prefix} ${label}`;
  }

  /**
   * @type {Application}
   */
  get application() {
    return this.entry;
  }

  get isSelected() {
    return allApplications.selection.containsApplication(this.application);
  }

  init = () => {
    this.contextValue = 'ApplicationNode';
    this.description = this.application.entryPointPath;
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {
    if (this.isSelected) {
      allApplications.selection.removeApplication(this.application);
    }
    else {
      allApplications.selection.addApplication(this.application);
    }
  }

  buildChildren() {
    return [];
  }
}