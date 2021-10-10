import { TreeItemCollapsibleState, EventEmitter, window } from 'vscode';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import { getThemeResourcePath } from './codePath';
import { registerCommand } from '../commands/commandUtil';
import { emitTreeViewAction, emitTreeViewCollapseChangeAction } from '../userEvents';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BaseTreeViewNodeProvider');

const nodeClasses = new Map();

function makeNodeClassId(NodeClass) {
  if (!NodeClass.name) {
    // in production, names might get mangled and/or removed entirely, so we need a different class identifier here
    logError(`NodeClass.name is empty (Terser setup problem?)`);
    let id = nodeClasses.get(NodeClass);
    if (!id) {
      id = nodeClasses.size + 1;
      nodeClasses.set(NodeClass, id);
    }

    return id;
  }
  return NodeClass.name;
}

export default class BaseTreeViewNodeProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  rootNodes;
  idsCollapsibleState = new Map();

  /**
   * @param {string} viewName 
   * @param {Object} [options]
   * @param {boolean} [options.showCollapseAll]
   * @param {boolean} [options.createTreeView]
   */
  constructor(viewName, options = {}) {
    this.viewName = viewName;
    const { showCollapseAll = false, createTreeView = true } = options;

    // NOTE: view creation inside the data provider is not ideal, 
    //      but it makes things a lot easier for now
    if (createTreeView) {
      this.treeView = window.createTreeView(viewName, {
        showCollapseAll: showCollapseAll,
        treeDataProvider: this
      });

      this.treeView.onDidCollapseElement(this.handleCollapsibleStateChanged);
      this.treeView.onDidExpandElement(this.handleCollapsibleStateChanged);
    }
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
      this.repaint();
    }
    catch (err) {
      logError(`${this.constructor.name}.refresh() failed`, err);
      throw err;
    }
  }

  repaint() {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Refresh iconPath of rootNodes and its children, then repaint the view
   */
  refreshIcon() {
    this._refreshNodesIconPath(this.rootNodes);
    this.repaint();
  }

  _refreshNodesIconPath(nodes) {
    if (nodes) {
      nodes.forEach(node => {
        node.iconPath = this.makeNodeIconPath(node);
        this._refreshNodesIconPath(node.children);
      });
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

    this.handleNodeCollapsibleStateChanged(node);
  }

  /**
   * @virtual
   */
  handleRefresh() {
    // can be overridden by children
  }

  /**
   * @virtual
   */
  handleClick = (node) => {
    const treeViewName = this.viewName;
    const action = ''; // not a button click
    const nodeId = node.id;
    const args = {
      description: node.description,
      clazz: node.constructor.name
    };

    const { clickUserActionType } = node;
    if (clickUserActionType !== false) {
      emitTreeViewAction(treeViewName, action, nodeId, node.label, clickUserActionType, args);
    }

    node.handleClick?.();
  }

  handleNodeCollapsibleStateChanged = (node) => {
    const treeViewName = this.viewName;
    const action = ''; // not a button click
    const nodeId = node.id;
    const args = {
      description: node.description,
      clazz: node.constructor.name,
      collapsibleState: node.collapsibleState
    };

    emitTreeViewCollapseChangeAction(treeViewName, action, nodeId, node.label, node.collapseChangeUserActionType, args);

    node.handleCollapsibleStateChanged?.();
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

  buildChildren(node) {
    node.children = node.buildChildren && node.buildChildren() || node.buildChildrenDefault();
    this.decorateChildren(node);
    return node.children;
  }

  decorateChildren(node) {
    this._decorateNodes(node, node.children);
  }

  // ###########################################################################
  // per-node operations
  // ###########################################################################

  makeNodeId(NodeClass, parent, i) {
    const nodeClassId = makeNodeClassId(NodeClass);
    return [parent?.id || '', nodeClassId, i].join('..');
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
      const id = this.makeNodeId(child.constructor, parent, index);

      // decorate based on id
      this._decorateNewNode(child, id);
    });
  }

  _decorateNewNode(node, id) {
    // id
    node.id = id;

    // TODO: keep track of all node ids, since VSCode shows an error to the user if we don't do it right (and does not allow us to even log it)

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
    const commandName = node.clickCommandName || this.clickCommandName;

    if (!commandName) {
      return;
    }

    node.command = {
      command: commandName,
      arguments: [node]
    };
  }


  // ###########################################################################
  // overriding TreeDataProvider
  // ###########################################################################

  getTreeItem = (node) => {
    return node;
  }

  getChildren = async (node) => {
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