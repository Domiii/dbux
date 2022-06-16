import isFunction from 'lodash/isFunction';
import { TreeItemCollapsibleState, EventEmitter, window, TreeView } from 'vscode';
import SyncPromise from '@dbux/common/src/util/SyncPromise';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { newLogger } from '@dbux/common/src/log/logger';
import NestedError from '@dbux/common/src/NestedError';
import { throttle } from '@dbux/common/src/util/scheduling';
import { getThemeResourcePath } from '../codePath';
import { registerCommand } from '../../commands/commandUtil';
import { emitTreeViewAction, emitTreeViewCollapseChangeAction } from '../../userEvents';
import BaseTreeViewNode from './BaseTreeViewNode';

/** @typedef { import("./BaseTreeViewNode").default } BaseTreeViewNode */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('BaseTreeViewNodeProvider');

const allNodeClasses = new Map();

function makeNodeClassId(NodeClass) {
  if (!NodeClass.name) {
    // in production, names might get mangled and/or removed entirely, so we need a different class identifier here
    logError(`NodeClass.name is empty (Terser setup problem?)`);
    let id = allNodeClasses.get(NodeClass);
    if (!id) {
      id = allNodeClasses.size + 1;
      allNodeClasses.set(NodeClass, id);
    }

    return id;
  }
  return NodeClass.name;
}

export default class BaseTreeViewNodeProvider {
  _onDidChangeTreeData = new EventEmitter();
  onDidChangeTreeData = this._onDidChangeTreeData.event;

  rootNodes = [];
  idsCollapsibleState = new Map();
  /**
   * @type {TreeView<BaseTreeViewNode>}
   */
  treeView;

  /**
   * @param {string} viewName 
   * @param {Object} [options]
   * @param {boolean} [options.showCollapseAll]
   * @param {boolean} [options.createTreeView]
   */
  constructor(viewName, options = {}) {
    this.treeViewName = viewName;
    this.logger = newLogger(this.constructor.name);
    this.refreshPromise = new SyncPromise(500);
    const { showCollapseAll = false, createTreeView = true } = options;

    // NOTE: view creation inside the data provider is not ideal, 
    //      but it makes things a lot easier for now
    if (createTreeView) {
      this.treeView = window.createTreeView(viewName, {
        showCollapseAll: showCollapseAll,
        treeDataProvider: this
      });
      this.defaultTitle = this.treeView.title;

      this.treeView.onDidCollapseElement(this.handleCollapsibleStateChanged);
      this.treeView.onDidExpandElement(this.handleCollapsibleStateChanged);
    }
  }

  initDefaultClickCommand(context) {
    registerCommand(context,
      this.clickCommandName = `${this.treeViewName}.click`,
      (node) => this.handleClick(node)
    );
  }

  /** ###########################################################################
   * treeview controll
   *  #########################################################################*/

  resetTitle() {
    this.setTitle(this.defaultTitle);
  }

  decorateTitle(decoration) {
    this.setTitle(`${this.defaultTitle} ${decoration}`);
  }

  setTitle(title) {
    if (this.treeView) {
      this.treeView.title = title;
    }
    else {
      this.logger.error(`Cannot setTitle before treeView is created.`);
    }
  }

  /**
   * hackfix: VSCode API does not guarantee `TreeView.reveal` works with `undefined`, but we've tested that it works in VSCode 1.63.2.
   *  @see https://code.visualstudio.com/api/references/vscode-api#TreeView
   */
  async showView() {
    return await this.treeView.reveal(undefined);
  }

  // ###########################################################################
  // basic event handling
  // ###########################################################################

  /**
   * Re-generate (only starting from root for now)
   * 
   * TODO: allow refreshing sub tree only
   */
  // refresh = () => {
  refresh = throttle(() => {
    try {
      this.rootNodes = this.buildRoots();
      this._decorateNodes(null, this.rootNodes);
      this.handleRefresh();
      this.#invalidate();

      this.refreshPromise.startIfNotStarted();
    }
    catch (err) {
      throw new NestedError(`${this.constructor.name}.refresh() failed`, err);
    }
  }, 50);

  refreshOnData() {
    return this.refresh();
  }
  // refreshOnData = throttle(() => {
  //   this.refresh();
  // }, 50);

  // repaint = throttle(() => {
  //   this._onDidChangeTreeData.fire();
  // }, 10);

  #invalidate() {
    this._onDidChangeTreeData.fire();
  }

  refreshNode = throttle((treeItem) => {
    this._onDidChangeTreeData.fire(treeItem);
  }, 50);

  /**
   * Refresh iconPath of rootNodes and its children, then repaint the view
   */
  refreshIcon() {
    this._refreshNodesIconPath(this.rootNodes);
    this.#invalidate();
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
    let evtHandler;
    switch (node.collapsibleState) {
      case TreeItemCollapsibleState.Collapsed:
        node.collapsibleState = TreeItemCollapsibleState.Expanded;
        evtHandler = this.handleExpanded;
        break;
      case TreeItemCollapsibleState.Expanded:
        node.collapsibleState = TreeItemCollapsibleState.Collapsed;
        evtHandler = this.handleCollapsed;
        break;
      default:
        this.logger.error('invalid node collapsibleState on state change: ', node.collapsibleState, node);
        break;
    }
    this.idsCollapsibleState.set(node.id, node.collapsibleState);

    // record user action
    const { treeViewName } = this;
    const action = ''; // not a button click
    const nodeId = node.id;
    const args = {
      description: node.description,
      clazz: node.constructor.name,
      collapsibleState: node.collapsibleState
    };
    
    // trigger event handlers
    evtHandler.call(this, node);
    this.handleNodeCollapsibleStateChanged(node);
    emitTreeViewCollapseChangeAction(treeViewName, action, nodeId, node.label, node.collapseChangeUserActionType, args);
  }

  handleExpanded(node) {
    node.handleExpanded?.();
  }

  handleCollapsed(node) {
    if (node._handleDeactivate && !node.alwaysActive) {
      node._handleDeactivate();
    }
    node.handleCollapsed?.();
  }

  handleNodeCollapsibleStateChanged = (node) => {
    node.handleCollapsibleStateChanged?.();
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
  handleClick = async (node) => {
    const { treeViewName } = this;
    const action = ''; // not a button click
    const nodeId = node.id;
    const args = {
      description: node.description,
      clazz: node.constructor.name
    };

    
    try {
      await node.handleClick?.();
      const { clickUserActionType } = node;
      if (clickUserActionType !== false) {
        emitTreeViewAction(treeViewName, action, nodeId, node.label, clickUserActionType, args);
      }
    }
    catch (err) {
      throw new NestedError(`handleClick failed`, err);
    }
  }

  // ###########################################################################
  // building
  // ###########################################################################

  handleBeforeChildren(node) {
    // NOTE: this will be triggered before the `expanded` event, so we activate here.
    if (node._handleActivate && !node.alwaysActive) {
      node._handleActivate();
    }
  }

  buildRoots() {
    throw new Error('abstract method not implemented');
  }

  buildNode(NodeClass, entry, parent, moreProps = EmptyObject) {
    const newProps = NodeClass.makeProperties?.(entry, parent, moreProps) || EmptyObject;
    moreProps = {
      entry,
      ...moreProps,
      ...newProps
    };
    const label = NodeClass.makeLabel(entry, parent, moreProps, this);
    return new NodeClass(this, label, entry, parent, moreProps);
  }

  /**
   * @param {BaseTreeViewNode} node 
   */
  async buildChildren(node) {
    node.children = node.buildChildren && await node.buildChildren() || await node.buildChildrenDefault();
    this.decorateChildren(node);
    return node.children;
  }

  buildNodes(nodeClasses, parent) {
    if (!nodeClasses) {
      return null;
    }

    return nodeClasses
      .map(Clazz => {
        const props = (Clazz.makeChildPropsDefault || BaseTreeViewNode.makeChildPropsDefault)?.(Clazz);
        return this.buildNode(Clazz, parent.entry, parent, props);
      })
      .filter(node => !!node);
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
      if (isFunction(child)) {
        throw new Error(`TreeNode should not be (but is) a function. Maybe you forgot to call makeTreeItem(s)? - ${child.toString()}`);
      }
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
    else if (node.children?.length || this._canNodeProduceChildren(node)) {
      let collapsibleState = this.idsCollapsibleState.get(id);
      if (collapsibleState === undefined) {
        collapsibleState = node.defaultCollapsibleState || TreeItemCollapsibleState.Collapsed;
        // this.idsCollapsibleState.set(id, collapsibleState);
      }
      node.collapsibleState = collapsibleState;
    }
    else {
      // future-work: DON'T OVERRIDE TreeItemCollapsibleState IF THE NODE ALREADY WAS DEFINED WITH THE STATE IT WANTS (*yargs*)
      node.collapsibleState = node.defaultCollapsibleState || TreeItemCollapsibleState.None;
    }

    // click handler
    this._setNodeCommand(node);

    // if (node.collapsibleState === TreeItemCollapsibleState.Expanded) {
    //   // generate children right away?
    // }

    // init
    node.init?.();
    if (node._handleActivate && node.alwaysActive) {
      // activate right away
      node._handleActivate();
    }

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

  /**
   * @param {TreeItem} node 
   */
  getChildren = async (node) => {
    // this.logger.debug(`getChildren ${node?.label || node}`);
    const children = await this._getChildren(node);
    this.refreshPromise.resolve(children);
    return children;
  }

  _getChildren = async (node) => {
    try {
      if (node) {
        this.handleBeforeChildren(node);
        if (this._canNodeProduceChildren(node)) {
          return node.children = await this.buildChildren(node);
        }
        if (node.children) {
          return node.children;
        }
        return null;
      }
      else {
        return this.rootNodes;
      }
    }
    catch (err) {
      this.logger.error(`${this.constructor.name}.getChildren() failed`, err);
      // debugger;
      throw err;
    }
  }

  _canNodeProduceChildren(node) {
    if (node.canHaveChildren) {
      // if it has `canHaveChildren`, then use it!
      return node.canHaveChildren();
    }
    return !!node.buildChildren;
  }

  getParent = (node) => {
    return node?.parent;
  }

  /** ###########################################################################
    * helper
    *  #########################################################################*/

  /**
   * Find root of given class.
   * @param {*} clazz A node class that extends `BaseTreeViewNode` 
   * @return {BaseTreeViewNode}
   */
  getRootByClass(clazz) {
    return this.rootNodes.find(node => node instanceof clazz);
  }
}