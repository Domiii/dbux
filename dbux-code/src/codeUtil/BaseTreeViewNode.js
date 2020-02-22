import { TreeItem } from 'vscode';

export default class BaseTreeViewNode extends TreeItem {
  parent;
  children: BaseNode[] = null;

  constructor(treeNodeProvider, label, entry, parent, moreProps) {
    super(label);

    this.entry = entry;
    this.treeNodeProvider = treeNodeProvider;
    this.parent = parent;

    // treeItem data
    // this.contextValue = this.constructor.name;

    // more custom props for this node
    Object.assign(this, moreProps);
  }

  /**
   * @virtual
   * @return true if it has a `buildChildren` method
   */
  canHaveChildren() {
    return !!this.children || !!this.buildChildren;
  }

  makeIconPath() {
    return '';
  }

  handleClick() {
    // by default: do nothing
  }
}