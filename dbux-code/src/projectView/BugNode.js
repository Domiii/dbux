import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class BugNode extends BaseTreeViewNode {
  static makeLabel(bug) {
    return bug.name;
  }

  get bug() {
    return this.entry;
  }

  init = () => {
    this.contextValue = 'dbuxProjectView.bugNode';
    this.description = this.bug.description;
  }

  canHaveChildren() {
    return false;
  }

  handleClick() {

  }
}