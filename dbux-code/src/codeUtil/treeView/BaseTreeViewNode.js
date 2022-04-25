import EmptyObject from '@dbux/common/src/util/EmptyObject';
import EventHandlerList from '@dbux/common/src/util/EventHandlerList';
import { TreeItem } from 'vscode';

/** @typedef {import('@dbux/data/src/pathways/UserActionType').default} UserActionType */
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

  /**
   * @type {EventHandlerList}
   */
  _activeEventHandlers;

  /**
   * If `true`, will `registerActiveEvents` right after `init`.
   * Else will activate and deactivate when expanding/collapsing.
   */
  alwaysActive = false;


  static makeLabel(/* entry */) {
    return '(unnamed node)';
  }

  static makeChildPropsDefault() {
    return EmptyObject;
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
   * Set this to a {@link UserActionType} to record onclick UserAction, or set to `false` to prevent recording
   * @virtual
   */
  get clickUserActionType() {
    return false;
  }

  /**
   * @virtual
   */
  handleClick() {
    // default: do nothing
  }

  buildChildrenDefault() {
    return this.treeNodeProvider.buildNodes(this.childClasses, this);
  }

  getOrBuildChildren() {
    if (this.chidlren === undefined) {
      this.treeNodeProvider.buildChildren(this);
    }
    return this.children;
  }

  // /**
  //  * @virtual
  //  */
  // buildChildren() {
  //   // default: no children
  // }

  /** ###########################################################################
   * event handlers (usually active while node is expanded)
   * ##########################################################################*/

  _activated = 0;

  get isActivated() {
    return !!this._activated;
  }

  _handleActivate() {
    if (!this.isActivated) {
      let arr = this.registerActiveEvents();
      if (arr) {
        if (!Array.isArray(arr)) {
          arr = [arr];
        }
        this._activeEventHandlers = new EventHandlerList(arr);
      }
      ++this._activated;
    }
  }

  _handleDeactivate() {
    if (this.isActivated) {
      this._activeEventHandlers?.unsubscribe();
      this._activeEventHandlers = null;
      --this._activated;
    }
  }

  /**
   * @return {[]?}
   */
  registerActiveEvents() {
    return null;
  }


  /** ###########################################################################
   * helper
   *  #########################################################################*/

  /**
   * Find a chlid node of given class from parent, or from roots if parent is `undefined`.
   * @param {*} clazz A node class that extends `BaseTreeViewNode` 
   * @param {BaseTreeViewNode} parent
   * @return {BaseTreeViewNode}
   */
  getChildByClass(clazz) {
    return this.children.find(node => node instanceof clazz);
  }
}