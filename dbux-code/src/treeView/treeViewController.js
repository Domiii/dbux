import { window, EventEmitter } from 'vscode';
import { newLogger } from 'dbux-common/src/log/logger';
import { TreeNodeProvider } from './TreeNodeProvider.js';
import ContextNode from './ContextNode.js';

const { log, debug, warn, error: logError } = newLogger('TreeView');

let treeViewController: TreeViewController;

export function initTreeView() {
  treeViewController = new TreeViewController('dbuxContextView', {
    canSelectMany: false,
    showCollapseAll: true
  });

  return treeViewController;
}

export class TreeViewController {
  constructor(viewId, options) {
    this.onChangeEventEmitter = new EventEmitter();
    this.treeDataProvider = new TreeNodeProvider(this.onChangeEventEmitter);
    this.treeView = window.createTreeView(viewId, { 
      treeDataProvider: this.treeDataProvider,
      ...options
    });
    this.onItemClickCallback = [];
  }

  refresh = () => {
    this.onChangeEventEmitter.fire();
  }

  getPreviousNode = () => {
    const lastNode = this.treeView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.treeDataProvider.rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== 1) id -= 1;
    return this.treeDataProvider.nodesByApp[id];
  }

  getNextNode = () => {
    const lastNode = this.treeView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.treeDataProvider.rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== this.treeDataProvider.nodesByApp.length) id += 1;
    return this.treeDataProvider.nodesByApp[id];
  }

  previous = () => {
    const node = this.getPreviousNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this.revealContext(node);
  }

  next = () => {
    const node = this.getNextNode();
    if (!node) return;
    this.lastSelectedNode = node;
    node.gotoCode();
    this.revealContext(node);
  }

  nodeOnClick = (node: ContextNode) => {
    this.lastSelectedNode = node;
    node.gotoCode();
    if (node.children.length) this.revealContext(node, true);
    for (let cb of this.onItemClickCallback) cb(node);
  }

  /**
   * @param {number} applicationId
   * @param {number} contextId
   */
  revealContextById = (applicationId, contextId, expand = false) => {
    const node = this.treeDataProvider.contextNodesByApp[applicationId][contextId];
    this.revealContext(node, expand);
  }

  /**
   * @param {ContextNode} node
   */
  revealContext = (node, expand = false) => {
    this.treeView.reveal(node, { expand });
  }

  onItemClick = (cb) => {
    this.onItemClickCallback.push(cb);
  }
}