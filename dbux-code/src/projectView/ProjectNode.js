import BaseTreeViewNode from '../codeUtil/BaseTreeViewNode';

export default class ProjectNode extends BaseTreeViewNode {
  static makeLabel(project) {
    return project || 'project name here';
  }

  init = () => {
    this.contextValue = 'ProjectNode';
  }

  get project() {
    return this.entry;
  }

  get isActivated() {
    return false;
  }
  
  handleClick() {
    
  }
  
  buildChildren() {
    return [];
  }
}