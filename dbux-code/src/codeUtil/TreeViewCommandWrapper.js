import {
  ExtensionContext
} from 'vscode';
import { registerCommand } from '../commands/commandUtil';

/**
 * Allows for rapid clicking of nodes to work.
 * 
 * Requires:
 *  * call `init` initially (usually from extension's `activate` function)
 * 
 * Structural requirements:
 *  * nodeDataProvider.rootNodes : Node[]
 *  * node.children : Node[]
 *  * node.parent : Node
 *  * node._handleClick : function
 */
export default class TreeViewCommandWrapper {
  _queue = [];
  _clickedBeforeRefresh = false;

  constructor(nodeDataProvider) {
    this.nodeDataProvider = nodeDataProvider;
  }

  // TODO: don't need to know the name; can auto-generate a unique name instead
  init(context: ExtensionContext, commandName) {
    this.commandName = commandName;
    registerCommand(context,
      commandName,
      this._handleClick
    );
  }

  setCommand(node) {
    node.command = {
      command: this.commandName,
      arguments: [node]
    };
  }

  indexOfNodeInParent(node) {
    let arr = node.parent?.children || this.nodeDataProvider.rootNodes;
    return arr.indexOf(node);
  }

  getPath(node, _path = []) {
    if (!node) {
      return _path;
    }

    _path.push(this.indexOfNodeInParent(node));

    return this.getPath(node.parent, _path);
  }

  getNodeAtPath(path) {
    let i = 0;
    let current = this.nodeDataProvider.rootNodes[path[i++]];
    while (current && i < path.length) {
      current = current.children[path[i++]];
    }
    return current;
  }

  _handleClick = (node) => {
    if (!this._clickedBeforeRefresh) {
      console.debug('click', node.trace?.traceId, this._queue.length, node.constructor.name);
      this._doClick(node);
    }
    else {
      // queue one
      console.debug('click queue', this._queue.length, node.constructor.name);
      this._queue.push(this.getPath(node));
    }
  }

  notifyRefresh = () => {
    // dequeue one
    console.debug('refresh', this._queue.length);
    this._clickedBeforeRefresh = false;
    this._processQueue();
  }

  _processQueue() {
    if (!this._queue.length) {
      return;
    }

    const path = this._queue.shift();
    const node = this.getNodeAtPath(path);

    console.debug('click dequeue', this._queue.length, node.constructor.name);

    if (node) {
      this._doClick(node);
    }
    else {
      // queue becomes worthless if we cannot find a node at clicked path
      this._queue = [];
    }
  }

  _doClick(node) {
    this._clickedBeforeRefresh = true;
    node._handleClick();
  }
}