import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { TreeItem, TreeItemCollapsibleState } from 'vscode';

/** @typedef {import('./BaseTreeViewNodeProvider').default} BaseTreeViewNodeProvider */

export default class BaseTreeViewNode extends TreeItem {
  parent;
  /**
   * @type {TreeItem[]}
   */
  children = null;

  /**
   * Classes of child nodes to be generated (one per class).
   * Is only used if `buildChildren` is not implemented.
   */
  childClasses = null;

  /**
   * @type {BaseTreeViewNodeProvider}
   */
  treeNodeProvider;

  static makeLabel(/* entry */) {
    return '(unnamed node)';
  }

  constructor(treeNodeProvider, label, entry, parent, moreProps) {
    super(label, moreProps?.collapsibleState);

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
   * @return true if it has `children` or a `buildChildren` method or childClasses (used by buildChildrenDefault)
   */
  canHaveChildren() {
    return !!this.children || !!this.buildChildren || !!this.childClasses;
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

  static makeChildPropsDefault() {
    return EmptyObject;
  }


  buildChildrenDefault() {
    return this.treeNodeProvider.buildNodes(this.childClasses);
  }

  // /**
  //  * @virtual
  //  */
  // buildChildren() {
  //   // default: no children
  // }
}