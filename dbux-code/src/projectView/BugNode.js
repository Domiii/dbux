import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class BugNode extends BaseTreeViewNode {
  static makeLabel(bug) {
    return bug.name;
  }

  get bug() {
    return this.entry;
  }

  isActive() {
    const bugRunner = this.treeNodeProvider.controller.manager.getOrCreateRunner();
    return bugRunner.isBugActive(this.bug);
  }

  init = () => {
    this.contextValue = 'dbuxProjectView.bugNode' + (this.isActive() ? '.activated' : '');
    this.description = this.bug.description;
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }
}