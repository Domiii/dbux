import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import GraphBase from './GraphBase';
import ContextNode from './syncGraph/ContextNode';

/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SyncGraphBase');

class SyncGraphBase extends GraphBase {
  /**
   * @type {Map<ExecutionContext, ContextNode>}
   */
  contextNodesByContext;

  init() {
    this.roots = new Set();
    this.contextNodesByContext = new Map();
    this.state.applications = [];
    this._emitter = new NanoEvents();
    this._unsubscribeOnNewData = [];

    this.controllers.createComponent('GraphNode', {
      mode: GraphNodeMode.ExpandChildren,
      hasChildren: true
    });
    this.controllers.createComponent('ContextNodeManager');
    this.controllers.createComponent('PopperController');
  }

  /** ###########################################################################
   * public interface
   *  #########################################################################*/

  handleRefresh() {
    this.updateContextNodes();
  }

  updateContextNodes() {
    throw new Error('abstract method not implemented');
  }

  _resubscribeOnData() {
    throw new Error('abstract method not implemented');
  }

  clear() {
    this.removeAllContextNode();
  }

  // ###########################################################################
  // Context Node management
  // ###########################################################################

  updateByContexts(contexts) {
    const newRoots = new Set(contexts);
    const oldRoots = new Set(this.roots);

    // always re-subscribe since applicationSet clears subscribtion everytime it changes
    this._resubscribeOnData();

    // remove old roots
    for (const root of oldRoots) {
      if (!newRoots.has(root)) {
        this._removeContextNode(root);
      }
    }

    // remove new roots if exists as an old children, then add
    for (const root of newRoots) {
      const node = this.contextNodesByContext.get(root);
      if (node) {
        if (oldRoots.has(root)) {
          continue;
        }
        else {
          this._removeContextNode(root);
        }
      }
      this._addRoot(root);
    }

    this.roots = newRoots;
  }

  removeAllContextNode() {
    for (const { state: { context } } of this.contextNodesByContext.values()) {
      this._removeContextNode(context);
    }
  }

  getAllContextNode() {
    return this.contextNodesByContext.values();
  }

  _addRoot(context) {
    return this._addContextNode(this, context);
  }

  _addContextNode(parentNode, context) {
    if (this.contextNodesByContext.get(context)) {
      this.logger.warn(`ContextNode with id=${context.contextId} already exist`);
      return null;
    }

    const contextNode = parentNode.children.createComponent('ContextNode', {
      context,
    });

    this.contextNodesByContext.set(context, contextNode);
    contextNode.addDisposable(() => {
      this.contextNodesByContext.delete(context);
    });

    return contextNode;
  }

  _removeContextNode(context) {
    const contextNode = this.contextNodesByContext.get(context);
    // NOTE: sometimes, `contextNode` does not exist, for some reason
    //    -> might be because `this.roots` contains roots that are not actually displayed
    contextNode?.dispose();
    this.contextNodesByContext.delete(context);
  }

  buildContextNodeChildren(contextNode) {
    if (contextNode.childrenBuilt) {
      return contextNode.children.getComponents('ContextNode');
    }

    contextNode.childrenBuilt = true;
    return contextNode.getValidChildContexts().map(context => {
      return this._addContextNode(contextNode, context);
    });
  }

  /**
   * @param {ExecutionContext} context 
   * @returns 
   */
  buildContextNode(context) {
    const { applicationId } = context;
    const dp = allApplications.getById(applicationId).dataProvider;
    let currentContext = context;
    let currentNode;
    const contextQueue = [];

    while (!(currentNode = this.contextNodesByContext.get(currentContext))) {
      if (!currentContext) {
        // all of its ascendents are not presented
        // this.logger.error(`Cannot build context node: No parent context of context ${context} exists. contextQueue=[${contextQueue.map(x => x?.contextId)}]`);
        return null;
      }
      contextQueue.push(currentContext);
      currentContext = dp.collections.executionContexts.getById(currentContext.parentContextId);
    }

    for (const childContext of contextQueue.reverse()) {
      this.buildContextNodeChildren(currentNode);
      currentNode = this.contextNodesByContext.get(childContext);
    }

    return currentNode;
  }

  /**
   *  @return {ContextNode}
   */
  getContextNodeById(applicationId, contextId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    return this.getContextNodeByContext(context);
  }

  /**
   * Find or create a ContextNode.
   *  @return {ContextNode}
   */
  getContextNodeByContext = (context) => {
    let node = this.contextNodesByContext.get(context);
    if (!node) {
      // node is not created yet
      node = this.buildContextNode(context);
    }

    return node;
  }

  /**
   *  @return {ContextNode}
   */
  getContextNodeByContextForce = (context) => {
    const node = this.getContextNodeByContext(context);
    if (!node) {
      this.logger.error(`Can neither find ContextNode for context ${context} nor create one.`);
    }
    return node;
  }

  _selectContextNode(contextNode) {
    if (this._selectedContextNode && !this._selectedContextNode.isDisposed) {
      // deselect old
      this._selectedContextNode.setSelected(false);
    }

    if (contextNode) {
      // select new
      contextNode.setSelected(true);
    }

    this._selectedContextNode = contextNode;
  }

  handleTraceSelected = async (trace) => {
    await this.waitForRefresh();
    let contextNode;
    if (trace) {
      const { applicationId, contextId } = trace;
      contextNode = this.getContextNodeById(applicationId, contextId);
      if (this.context.graphDocument.state.followMode && contextNode) {
        // NOTE: since we do this right after init, need to check if contextNode have been built
        await contextNode.waitForInit();
        await this.focusController.focus(contextNode);
      }
    }
    this._selectContextNode(contextNode);
  }

  getChildrenCounts() {
    return this.children.getComponents('ContextNode').length;
  }
  
  getSubGraphChildrenCounts() {
    return this.children.getComponents('ContextNode').reduce((v, node) => v + node.nTreeContexts, 0);
  }

  // ###########################################################################
  // own event listener
  // ###########################################################################

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }

  shared() {
    return {
      context: {
        graphRoot: this,
      }
    };
  }
}

export default SyncGraphBase;