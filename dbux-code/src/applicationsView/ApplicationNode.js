import allApplications from 'dbux-data/src/applications/allApplications';
import Application from 'dbux-data/src/applications/Application';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(app: Application) {
    const prefix = allApplications.selection.containsApplication(app) ? '☑' : '☐';
    // const label = app.getRelativeFolder();
    const label = app.getPreferredName();
    return `${prefix} ${label}`;
  }

  init = () => {
    this.contextValue = 'ApplicationNode';
  }

  get application() {
    return this.entry;
  }

  get isSelected() {
    return allApplications.selection.containsApplication(this.application);
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