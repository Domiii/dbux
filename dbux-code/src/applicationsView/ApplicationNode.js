import allApplications from 'dbux-data/src/applications/allApplications';
import Application from 'dbux-data/src/applications/Application';
import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class TraceNode extends BaseTreeViewNode {
  static makeLabel(app: Application) {
    const prefix = allApplications.selection.containsApplication(app) ? '☑' : '☐';
    // const label = app.getRelativeFolder();
    const label = app.getFileName();
    return `${prefix} ${label}`;
  }

  get application() {
    return this.entry;
  }

  get isSelected() {
    return allApplications.selection.containsApplication(this.application);
  }

  makeIconPath() {
    return '';
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
    // // add other traces as children (before details) 
    // return this.childTraces?.map(
    //   other => this.treeNodeProvider.buildTraceNode(other, this));
    return [];
  }
}