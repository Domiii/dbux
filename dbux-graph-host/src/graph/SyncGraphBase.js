import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import GraphBase from './GraphBase';
import ContextNode from './syncGraph/ContextNode';
import EmptyArray from '@dbux/common/src/util/EmptyArray';

/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SyncGraphBase');

/** ###########################################################################
 * {@link ContextNodegraph}
 * ##########################################################################*/

class ContextHoleNode {
  id;
  contexts = [];
}

/**
 * Provides a graph-with-holes data structure.
 * Holes are connected subgraphs for which each node of that subgraph holds the given predicate.
 */
class CallGraphNodes {
  /**
   * @type {SyncGraphBase}
   */
  graph;
  /**
   * Decides whether the given context should be displayed or "is part of a hole".
   * 
   * @type {(context) => Boolean}
   */
  predicate;

  /**
   * @type {Map<ExecutionContext, ContextNode>}
   */
  contextNodesByContext;
  /**
   * @type {Map<ExecutionContext, ContextHoleNode>}
   */
  holeNodesByContext;

  _lastHoldeNodeId = 0;
  holeNodesById = [];

  constructor(graph, predicate) {
    this.graph = graph;
    this.predicate = predicate || (() => true);

    this.clear();
  }

  has(context) {
    this.contextNodesByContext.has(context);
  }

  /**
   * @param {ExecutionContext} context
   * @return {ContextNode | HoleNode} 
   */
  getContextNodeByContext(context) {
    return this.contextNodesByContext.get(context);
  }

  getAllContextNodes() {
    return this.contextNodesByContext.values();
  }

  add(parentNode, context) {
    if (this.getContextNodeByContext(context)) {
      this.graph.logger.warn(`Tried to add ContextNode with id=${context.contextId} but Node already exist`);
      return null;
    }

    const contextNode = parentNode.children.createComponent('ContextNode', {
      context,
    });

    this.contextNodesByContext.set(context, contextNode);
    contextNode.addDisposable(() => {
      this._handleContextNodeDisposed(context, contextNode);
    });

    return contextNode;
  }

  _handleContextNodeDisposed = (context, contextNode) => {
    if (this.getContextNodeByContext(context) === contextNode) {
      // actual removal of node
      this.contextNodesByContext.delete(context);
    }
  }

  delete(context) {
    const contextNode = this.getContextNodeByContext(context);
    // NOTE: sometimes, `contextNode` does not exist, for some reason
    //    -> might be because `this.roots` contains roots that are not actually displayed
    if (contextNode) {
      // this will trigger _handleContextNodeDisposed -> removal
      contextNode.dispose();
    }
    else {
      // don't do this -> because this is also called when iterating over `...values()`
      // this._nodes.delete(context);
    }
  }

  /**
   * This function ONLY makes sure that (i) given node, (ii) its children and (iii) all its ancestors are built.
   * NOTE: Subgraph expansion is done recursively in {@link GraphNode#setMode}.
   * 
   * @param {ExecutionContext} context 
   * @returns 
   */
  buildContextNode(context) {
    const { applicationId } = context;
    const dp = allApplications.getById(applicationId).dataProvider;
    let currentContext = context;
    let currentNode;
    const ancestors = [];

    while (!(currentNode = this.getContextNodeByContext(currentContext))) {
      if (!currentContext) {
        // root
        return null;
      }
      ancestors.push(currentContext);
      currentContext = dp.collections.executionContexts.getById(currentContext.parentContextId);
    }

    for (const childContext of ancestors.reverse()) {
      this.buildContextNodeChildren(currentNode);
      currentNode = this.getContextNodeByContext(childContext);
    }

    return currentNode;
  }


  /**
   * This function makes sure that the given node's children are built.
   * This is called by `#buildContextNode` and `GraphNode.setOwnMode`.
   * 
   * @param {ContextNode} contextNode 
   */
  buildContextNodeChildren(contextNode) {
    if (contextNode.childrenBuilt) {
      return contextNode.children.getComponents('ContextNode');
    }

    contextNode.childrenBuilt = true;
    return contextNode.getValidChildContexts().map(context => {
      return this.add(contextNode, context);
    });
  }

  clear() {
    if (this.contextNodesByContext) {
      for (const { state: { context } } of this.getAllContextNodes()) {
        this.delete(context);
      }
    }

    this.contextNodesByContext = new Map();
    this.holeNodesByContext = new Map();
    this._lastHoldeNodeId = 0;
    this.holeNodesById = [];
  }
}

/** ###########################################################################
 * {@link SyncGraphBase}
 * ##########################################################################*/

class SyncGraphBase extends GraphBase {
  /**
   * @type {Map<ExecutionContext, ContextNode>}
   */
  contextNodesByContext;
  /**
   * @type {CallGraphNodes}
   */
  _nodes;

  init() {
    this._nodes = new CallGraphNodes(this);
    this.roots = new Set();
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
    this.updateAllRoots();
  }

  /**
   * @return {Array.<ExecutionContext>} All root contexts participating in this graph.
   */
  getAllRootContexts() {
    throw new Error('abstract method not implemented');
  }

  _resubscribeOnData() {
    throw new Error('abstract method not implemented');
  }

  clear() {
    this.roots = new Set();
    return this._nodes.clear();
  }

  // ###########################################################################
  // Context Node management
  // ###########################################################################

  /**
   * @param {*} newRootsArr 
   */
  updateAllRoots() {
    const allRoots = this.getAllRootContexts();
    const newRoots = new Set(allRoots);
    const oldRoots = this.roots;

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
      const node = this.getContextNodeByContext(root);
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

    this._setApplicationState();
  }

  getAllContextNodes() {
    return this._nodes.getAllContextNodes();
  }

  _addRoot(context) {
    return this._nodes.add(this, context);
  }

  _removeContextNode(context) {
    this._nodes.delete(context);
  }

  /**
   * Find or create a ContextNode.
   *  @return {ContextNode}
   */
  getContextNodeByContext = (context) => {
    return this._nodes.getContextNodeByContext(context);
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
   *  @return {ContextNode}
   */
  getContextNodeByContextForce = (context) => {
    const node = this.getContextNodeByContext(context);
    if (!node) {
      this.logger.error(`Can neither find ContextNode for context ${context} nor create one.`);
    }
    return node;
  }

  /**
   * This function ONLY makes sure that (i) given node, (ii) its children and (iii) all its ancestors are built.
   * NOTE: Subgraph expansion is done recursively in {@link GraphNode#setMode}.
   * 
   * @param {ExecutionContext} context 
   * @returns 
   */
  buildContextNode(context) {
    return this._nodes.buildContextNode(context);
  }

  /**
   * Makes sure that the given node's children are built.
   * This is called by `#buildContextNode` and `GraphNode.setOwnMode`.
   * 
   * @param {ContextNode} contextNode 
   */
  buildContextNodeChildren(contextNode) {
    return this._nodes.buildContextNodeChildren(contextNode);
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

  getChildrenCount() {
    return this.children.getComponents('ContextNode').length;
  }

  getSubGraphChildrenCount() {
    return this.children.getComponents('ContextNode').reduce((v, node) => v + node.nTreeContexts, 0);
  }

  /** ###########################################################################
   * State management
   *  #########################################################################*/

  _setApplicationState() {
    const update = {
      applications: this.makeApplicationState()
    };
    this.setState(update);
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