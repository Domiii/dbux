import { newLogger } from 'dbux-common/src/log/logger';
import { window, EventEmitter } from 'vscode';
import { TreeNodeProvider } from './TreeNodeProvider.js';
import ContextNode from './ContextNode.js';

const { log, debug, warn, error: logError } = newLogger('TreeView');

let eventLogProvider, treeViewController: TreeViewController;

export function initTreeView(context, dataProvider){

  let onChangeEventEmitter = new EventEmitter();
  eventLogProvider = new TreeNodeProvider(dataProvider, onChangeEventEmitter);
  treeViewController = new TreeViewController('dbuxView', eventLogProvider, onChangeEventEmitter, {
    canSelectMany: false,
    showCollapseAll: true
  });
  
}

export function getOrCreateTreeViewController(){
  return treeViewController;
}

export class TreeViewController {
  constructor(viewId, treeDataProvider: TreeNodeProvider, onChangeEventEmitter, options){
    this.treeView = window.createTreeView(viewId, { treeDataProvider: treeDataProvider, ...options});
    this.treeDataProvider = treeDataProvider;
    this.onChangeEventEmitter = onChangeEventEmitter;
  }

  refresh = () => {
    this.onChangeEventEmitter.fire();
  }

  getNextNode = () => {
    const lastNode = this.treeView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.treeDataProvider.rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== this.treeDataProvider.nodesByContext.length) id += 1;
    return this.treeDataProvider.nodesByContext[id];
  }

  getPreviousNode = () => {
    const lastNode = this.treeView.selection[0] || this.lastSelectedNode;
    if (!lastNode) return this.treeDataProvider.rootNodes[0] || null;
    let id = lastNode.contextId;
    if (id !== 1) id -= 1;
    return this.treeDataProvider.nodesByContext[id];
  }

  next = () => {
    const node = this.getNextNode();
    if (!node) return;
    node.gotoCode();
    this.treeView.reveal(node);
  }

  previous = () => {
    const node = this.getPreviousNode();
    if (!node) return;
    node.gotoCode();
    this.treeView.reveal(node);
  }

  nodeOnClick = (node: ContextNode) => {
    this.lastSelectedNode = node;
    node.gotoCode();
    if (node.children.length) this.treeView.reveal(node, { expand: true })
  }

}