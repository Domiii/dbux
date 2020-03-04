import { TreeItem } from 'vscode';

export default class BaseTreeViewNode extends TreeItem {
  parent;
  children: BaseNode[] = null;

  static makeLabel(entry) {
    return '(unnamed node)';
  }

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
   */
  init() {
  }

  /**
   * @virtual
   * @return true if it has `children` or a `buildChildren` method
   */
  canHaveChildren() {
    return !!this.children || !!this.buildChildren;
  }

  /**
   * @virtual
   */
  makeIconPath() {
    // default: no icon
    return '';
  }

  /**
   * @virtual
   */
  handleClick() {
    // default: do nothing
  }

  // /**
  //  * @virtual
  //  */
  // buildChildren() {
  //   // default: no children
  // }
}