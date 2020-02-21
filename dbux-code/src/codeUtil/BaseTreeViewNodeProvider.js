import { TreeItemCollapsibleState, EventEmitter } from 'vscode';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import { getThemeResourcePath } from '../resources';

export default class BaseTreeViewNodeProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  rootNodes;
  idsCollapsibleState = new Map();

  refresh = () => {
    try {
      this.rootNodes = this.buildRoots();

      // NOTE: if we only want to update subtree, pass root of subtree to `fire`
      this._onDidChangeTreeData.fire();
    }
    catch (err) {
      console.error(err);
      debugger;
    }
  }

  // ###########################################################################
  // building
  // ###########################################################################

  buildRoots() {
    throw new Error('abstract method not implemented');
  }

  buildNode(NodeClass, entry, application, parent, moreProps = EmptyObject) {
    const label = NodeClass.makeLabel(entry, application, parent);
    return new NodeClass(this, label, entry, application, parent, moreProps);
  }

  buildChildren(parent) {
    parent.children = parent.buildChildren();
    this._decorateChildren(parent);
    return parent.children;
  }

  // ###########################################################################
  // per-node operations
  // ###########################################################################

  makeNodeId(nodeClassName, parent, i) {
    return [parent?.id || '', nodeClassName, i].join('..');
  }

  makeNodeIconPath(node) {
    const relativeIconPath = node.makeIconPath?.();
    return relativeIconPath && getThemeResourcePath(relativeIconPath) || null;
  }

  _decorateChildren(parent) {
    const { children } = parent;
    const childIndexes = new Map();

    // assign ids
    children?.forEach((child) => {
      // generate id
      const lastIdx = childIndexes.get(child.constructor) || 0;
      const index = lastIdx + 1;
      childIndexes.set(child.constructor, index);
      const id = this.makeNodeId(child.constructor.name, parent, index);
      this._decorateNewNode(child, id);
    });
  }

  _decorateNewNode(node, id) {
    // id
    node.id = id;

    // iconPath
    node.iconPath = this.makeNodeIconPath(node);

    // collapsibleState
    let collapsibleState = this.idsCollapsibleState.get(id);
    if (collapsibleState === undefined) {
      collapsibleState = node.canHaveChildren?.() ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None;
    }
    node.collapsibleState = collapsibleState;

    if (node.children) {
      // this node has built in children
      this._decorateChildren(node.children);
    }

    // if (node.collapsibleState === TreeItemCollapsibleState.Expanded) {
    //   // generate children right away?
    // }

    // init
    node.init?.();

    return node;
  }


  // ###########################################################################
  // overriding TreeDataProvider
  // ###########################################################################

  getTreeItem = (node) => {
    return node;
  }

  getChildren = (node) => {
    if (node) {
      if (node.children) {
        return node.children;
      }
      if (node.canHaveChildren()) {
        return this.buildChildren(node);
      }
      return null;
    }
    else {
      return this.rootNodes;
    }
  }

  getParent = (node) => {
    return node.parent;
  }
}