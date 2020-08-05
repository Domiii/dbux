import { window } from 'vscode';
import allApplications from '@dbux/data/src/applications/allApplications';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

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
    try {
      if (this.isSelected) {
        allApplications.selection.removeApplication(this.application);
      }
      else {
        allApplications.selection.addApplication(this.application);
      }
    }
    catch (err) {
      if (err.appBusyFlag) {
        window.showInformationMessage('[Dbux] Currently busy, try again');
      }
      else {
        throw err;
      }
    }
  }

  buildChildren() {
    return [];
  }
}