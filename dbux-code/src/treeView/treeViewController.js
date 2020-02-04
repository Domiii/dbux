import { newLogger } from 'dbux-common/src/log/logger';
import { window, EventEmitter } from 'vscode';
import { TreeNodeProvider } from './TreeNodeProvider.js';
import ContextNode from './ContextNode.js';

const { log, debug, warn, error: logError } = newLogger('TreeView');

let eventLogProvider, treeViewController: TreeViewController;

export function initTreeView() {

  let onChangeEventEmitter = new EventEmitter();
  eventLogProvider = new TreeNodeProvider(onChangeEventEmitter);
  treeViewController = new TreeViewController('dbuxView', eventLogProvider, onChangeEventEmitter, {
    canSelectMany: false,
    showCollapseAll: true
  });

  return treeViewController;

}

export class TreeViewController {
  constructor(viewId, treeDataProvider: TreeNodeProvider, onChangeEventEmitter, options) {
    this.treeView = window.createTreeView(viewId, { treeDataProvider, ...options });
    this.treeDataProvider = treeDataProvider;
    this.onChangeEventEmitter = onChangeEventEmitter;
    this.onClickCallback = [];
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
    for (let cb of this.onClickCallback) cb(node);
  }

  revealContextById = (contextId: number, expand = false) => {
    const node = this.treeDataProvider.nodesByApp[contextId];
    this.revealContext(node, expand);
  }

  revealContext = (node: ContextNode, expand = false) => {
    this.treeView.reveal(node, { expand });
  }

  onItemClick = (cb) => {
    this.onClickCallback.push(cb);
  }

}