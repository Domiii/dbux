import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { TreeItem } from 'vscode';

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

  /**
   * future-work: generalize to be used by all buildNode algorithms?
   */
  makeChildPropsDefault() {
    return EmptyObject;
  }


  buildChildrenDefault() {
    if (!this.childClasses) {
      return null;
    }

    return this.childClasses.map(Clazz => {
      const props = this.makeChildPropsDefault(Clazz);
      return this.treeNodeProvider.buildNode(Clazz, this.entry, this, props);
    });
  }

  // /**
  //  * @virtual
  //  */
  // buildChildren() {
  //   // default: no children
  // }
}