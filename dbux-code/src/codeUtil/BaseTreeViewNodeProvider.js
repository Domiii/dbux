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

  constructor(viewName) {
    this.viewName = viewName;
    // NOTE: view creation inside the data provider is not ideal, 
    //      but it makes things a lot easier for now
    this.treeView = window.createTreeView(viewName, {
      treeDataProvider: this
    });

    this.treeView.onDidCollapseElement(this.handleCollapsibleStateChanged);
    this.treeView.onDidExpandElement(this.handleCollapsibleStateChanged);
  }
  
  initDefaultClickCommand(context) {
    registerCommand(context,
      this.clickCommandName = `${this.viewName}.click`,
      (provider, node) => provider.handleClick(node)
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
      logError(err);
      debugger;
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

  buildNode(NodeClass, entry, application, parent, moreProps = EmptyObject) {
    const label = NodeClass.makeLabel(entry, application, parent);
    return new NodeClass(this, label, entry, application, parent, moreProps);
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
      if (node.canHaveChildren?.()) {
        collapsibleState = TreeItemCollapsibleState.Collapsed;
        // this.idsCollapsibleState.set(id, collapsibleState);
      }
      else {
        collapsibleState = TreeItemCollapsibleState.None;
      }
    }
    node.collapsibleState = collapsibleState;

    // click handler
    this._setNodeCommand(node);

    if (node.children) {
      // this node has built-in children
      this._decorateNodes(node.children);
    }

    // if (node.collapsibleState === TreeItemCollapsibleState.Expanded) {
    //   // generate children right away?
    // }

    // init
    node.init?.();

    return node;
  }

  _setNodeCommand(node) {
    if (!this.clickCommandName) {
      return;
    }
    
    node.command = {
      command: this.clickCommandName,
      arguments: [this, node]
    };
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