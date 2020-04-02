import { TreeItemCollapsibleState, EventEmitter, window, CommentThreadCollapsibleState } from 'vscode';
import EmptyObject from 'dbux-common/src/util/EmptyObject';
import { newLogger } from 'dbux-common/src/log/logger';
import { getThemeResourcePath } from '../resources';
import { registerCommand } from '../commands/commandUtil';

const { log, debug, warn, error: logError } = newLogger('editorTracesController');

export default class BaseTreeViewNodeProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  rootNodes;
  idsCollapsibleState = new Map();

  constructor(viewName, showCollapseAll = false) {
    this.viewName = viewName;
    // NOTE: view creation inside the data provider is not ideal, 
    //      but it makes things a lot easier for now
    this.treeView = window.createTreeView(viewName, {
      showCollapseAll,
      treeDataProvider: this
    });

    this.treeView.onDidCollapseElement(this.handleCollapsibleStateChanged);
    this.treeView.onDidExpandElement(this.handleCollapsibleStateChanged);
  }

  initDefaultClickCommand(context) {
    registerCommand(context,
      this.clickCommandName = `${this.viewName}.click`,
      (node) => this.handleClick(node)
    );
  }

  // ###########################################################################
  // basic event handling
  // ###########################################################################

  /**
   * Re-generate (only starting from root for now)
   * 
   * TODO: allow refreshing sub tree only
   */
  refresh = () => {
    try {
      this.rootNodes = this.buildRoots();
      this._decorateNodes(null, this.rootNodes);

      this.handleRefresh();

      // NOTE: if we only want to update subtree, pass root of subtree to `fire`
      this._onDidChangeTreeData.fire();
    }
    catch (err) {
      logError(`${this.constructor.name}.refresh() failed`, err);
      debugger;
      throw err;
    }
  }

  handleCollapsibleStateChanged = evt => {
    // the event does not actually tell us or modify the state; we have to keep track manually
    const node = evt.element;
    switch (node.collapsibleState) {
      case TreeItemCollapsibleState.Collapsed:
        node.collapsibleState = TreeItemCollapsibleState.Expanded;
        break;
      case TreeItemCollapsibleState.Expanded:
        node.collapsibleState = TreeItemCollapsibleState.Collapsed;
        break;
      default:
        logError('invalid node collapsibleState on state change: ', node.collapsibleState, node);
        break;
    }
    this.idsCollapsibleState.set(node.id, node.collapsibleState);
  }

  handleRefresh() {
    // does nothing by default
  }

  handleClick = (node) => {
    node.handleClick?.();
  }

  // ###########################################################################
  // building
  // ###########################################################################

  buildRoots() {
    throw new Error('abstract method not implemented');
  }

  buildNode(NodeClass, entry, parent, moreProps = EmptyObject) {
    const label = NodeClass.makeLabel(entry, parent, moreProps);
    return new NodeClass(this, label, entry, parent, moreProps);
  }

  buildChildren(parent) {
    parent.children = parent.buildChildren();
    this._decorateNodes(parent, parent.children);
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

  _decorateNodes(parent, children) {
    const childIndexes = new Map();

    // assign ids
    children?.forEach((child) => {
      // generate id (based on node type and position in tree)
      const lastIdx = childIndexes.get(child.constructor) || 0;
      const index = lastIdx + 1;
      childIndexes.set(child.constructor, index);
      const id = this.makeNodeId(child.constructor.name, parent, index);

      // decorate based on id
      this._decorateNewNode(child, id);
    });
  }

  _decorateNewNode(node, id) {
    // id
    node.id = id;

    // iconPath
    node.iconPath = this.makeNodeIconPath(node);

    // collapsibleState
    if ('collapsibleStateOverride' in node) {
      node.collapsibleState = node.collapsibleStateOverride;
    }
    else if (node.children?.length || node.canHaveChildren?.()) {
      let collapsibleState = this.idsCollapsibleState.get(id);
      if (collapsibleState === undefined) {
        collapsibleState = node.defaultCollapsibleState || TreeItemCollapsibleState.Collapsed;
        // this.idsCollapsibleState.set(id, collapsibleState);
      }
      node.collapsibleState = collapsibleState;
    }
    else {
      node.collapsibleState = node.defaultCollapsibleState || TreeItemCollapsibleState.None;
    }

    // click handler
    this._setNodeCommand(node);

    // if (node.collapsibleState === TreeItemCollapsibleState.Expanded) {
    //   // generate children right away?
    // }

    // init
    node.init?.();

    if (node.children) {
      // this node has built-in children
      this._decorateNodes(node, node.children);
    }

    return node;
  }

  _setNodeCommand(node) {
    if (!this.clickCommandName) {
      return;
    }

    node.command = {
      command: this.clickCommandName,
      arguments: [node]
    };
  }


  // ###########################################################################
  // overriding TreeDataProvider
  // ###########################################################################

  getTreeItem = (node) => {
    return node;
  }

  getChildren = (node) => {
    try {
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
    catch (err) {
      logError(`${this.constructor.name}.getChildren() failed`, err);
      debugger;
      throw err;
    }
  }

  getParent = (node) => {
    return node?.parent;
  }
}