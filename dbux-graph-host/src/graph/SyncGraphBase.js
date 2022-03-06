import NanoEvents from 'nanoevents';
import minBy from 'lodash/minBy';
import isPlainObject from 'lodash/isPlainObject';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import GraphBase from './GraphBase';
import ContextNode from './syncGraph/ContextNode';
import HoleNode from './syncGraph/HoleNode';
import makeIncludeContext from './makeIncludeContext';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./GraphDocument").default } GraphDocument */
/** @typedef { import("@dbux/data/src/RuntimeDataProvider").default } RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SyncGraphBase');

/**
 * @param {{ applicationId, contextId }} applicationIdHolder 
 * @return {RuntimeDataProvider}
 */
function getDp(applicationIdHolder) {
  return allApplications.getById(applicationIdHolder.applicationId).dataProvider;
}

/** ###########################################################################
 * {@link ContextNodegraph}
 * ##########################################################################*/

/**
 * pseudo type
 */
export class ContextNodeHoleClient {
  /**
   * @type {number}
   */
  contextCount;
}

/**
 * Keeps all data related to a hole.
 */
export class ContextNodeHole {
  id;
  /**
   * @type {ExecutionContext[]} All contexts that participate in the hole.
   */
  contexts;
  /**
   * @type {ExecutionContext[]} All child contexts following the hole. Produced by `floodHole`.
   */
  frontier;

  _sharedData;

  constructor(id, contexts, frontier) {
    this.id = id;
    this.contexts = contexts;
    this.frontier = frontier;
  }

  makeSharedData() {
    return this._sharedData || (this._sharedData = {
      contextCount: this.contexts.length
    });
  }
}

const DefaultPredicateCfg = {

};

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
  includePredicate;

  /**
   * @type {Map<ExecutionContext, ContextNode>}
   */
  contextNodesByContext;
  /**
   * @type {Map<ExecutionContext, HoleNode>}
   */
  holeNodesByContext;

  _lastHoldeId = 0;
  holeNodesById = [];

  constructor(graph, predicateCfg = DefaultPredicateCfg) {
    this.graph = graph;
    this._setIncludePredicate(predicateCfg);

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

  isHole(context) {
    return !this.includePredicate(context);
  }

  _setIncludePredicate(newPredicate) {
    if (isPlainObject(newPredicate)) {
      // config input
      newPredicate = makeIncludeContext(newPredicate);
    }
    this.includePredicate = newPredicate;
  }

  setIncludePredicate(newPredicate) {
    this._setIncludePredicate(newPredicate);

    // future-work: also remember and re-initiate GraphNodeMode of all visible nodes
    return this.graph.fullReset();
  }

  /** ###########################################################################
   * {@link #floodHole}
   * ##########################################################################*/

  /**
   * @param {ExecutionContext[]} contexts 
   * @param {ExecutionContext[]} frontier The "children" (neighboring nodes in ↓ direction) of the entire hole
   * @param {ExecutionContext} context 
   * @param {number} siblingIndex 
   */
  floodHole(contexts, frontier, context, goUp = true, goLeft = true, goRight = true, goDown = true, parentContext = undefined, siblingIndex = undefined) {
    const dp = getDp(context);

    parentContext = parentContext === undefined ?
      (context.parentContextId && dp.collections.executionContexts.getById(context.parentContextId)) :
      null;

    // 1. go up (parent)
    if (goUp && parentContext) {
      if (this.isHole(parentContext)) {
        // add to hole: ←↑→
        contexts.push(parentContext);
        this.floodHole(contexts, frontier, parentContext, true, true, true, false);
      }
    }

    if (goLeft || goRight) {
      const contextsOfParent = parentContext &&
        dp.util.getChildrenOfContextInRoot(parentContext.contextId) ||
        this.graph.getAllRootContexts();  // at root level -> siblings are other roots

      siblingIndex = siblingIndex !== undefined ? siblingIndex : contextsOfParent.indexOf(context);
      if (siblingIndex === -1) {
        this.graph.logger.error(`Could not look up siblingIndex in Graph Construction for context:\n  > "${dp.util.makeContextInfo(context)}"`);
      }
      else {
        // 2. go left (previous sibling)
        if (goLeft) {
          const leftIndex = siblingIndex - 1;
          if (leftIndex >= 0) {
            const left = contextsOfParent[leftIndex];
            if (this.isHole(left)) {
              // add to hole: ←↓
              contexts.push(left);
              this.floodHole(contexts, frontier, left, false, true, false, true, parentContext, leftIndex);
            }
          }
        }

        // 3. go right (next sibling)
        if (goRight) {
          const rightIndex = siblingIndex + 1;
          if (rightIndex < contextsOfParent.length) {
            const right = contextsOfParent[rightIndex];
            if (this.isHole(right)) {
              // add to hole: ↓→
              contexts.push(right);
              this.floodHole(contexts, frontier, right, false, false, true, true, parentContext, rightIndex);
            }
          }
        }
      }
    }

    // 4. go down (children)
    if (goDown) {
      const children = dp.util.getChildrenOfContextInRoot(context.contextId);
      // NOTE: Here, we specifically iterate over all children, 
      //      because sibling iteration would stop at the first non-filtered sibling,
      //      while this should go through all.
      for (let i = 0; i < children.length; ++i) {
        const child = children[i];
        if (this.isHole(child)) {
          // add to hole: ↓
          contexts.push(child);
          this.floodHole(contexts, frontier, child, false, false, false, true, context);
        }
        else {
          // NOTE: add all non-hole children to frontier
          frontier.push(child);
        }
      }
    }
  }

  /** ###########################################################################
   * {@link #add}
   * ##########################################################################*/

  /**
   * @param {HostComponentEndpoint} parentNode 
   */
  add(parentNode, context) {
    if (this.getContextNodeByContext(context)) {
      const dp = getDp(context);
      this.graph.logger.warn(`Tried to add ContextNode but Node already exist for context: ${dp.util.makeContextInfo(context)}`);
      return null;
    }

    let newNode;
    if (this.isHole(context)) {
      const contexts = [];
      const frontier = [];
      contexts.push(context);
      this.floodHole(contexts, frontier, context);
      const hole = this.createHole(contexts, frontier);
      const state = {
        // TODO: HoleNodes dont actually have a single representative `context`
        context: minBy(contexts, c => c.contextId),
        hole: hole.makeSharedData()
      };
      const hostOnlyState = {
        hole
      };
      newNode = parentNode.children.createComponent('HoleNode', state, hostOnlyState);
      for (const c of contexts) {
        // associate all contexts with the node
        this.contextNodesByContext.set(c, newNode);
      }
    }
    else {
      newNode = parentNode.children.createComponent('ContextNode', {
        context,
      });
      this.contextNodesByContext.set(context, newNode);
    }

    newNode.addDisposable(() => {
      this._handleContextNodeDisposed(context, newNode);
    });

    return newNode;
  }

  createHole(contexts, frontier) {
    const holeId = ++this._lastHoldeId;
    const hole = new ContextNodeHole(holeId, contexts, frontier);
    return hole;
  }

  /** ###########################################################################
   * {@link #buildContextNode}
   * ##########################################################################*/

  /**
   * This function ONLY makes sure that (i) given node, (ii) its children and (iii) all its ancestors are built.
   * Also takes care of holes (via {@link #add}).
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
    return contextNode.getActualChildContexts().map(context => {
      return this.add(contextNode, context);
    });
  }

  /** ###########################################################################
   * dispose, delete, clear
   * ##########################################################################*/

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
    const includePredicate = this.componentManager.externals.getContextFilter();
    this._nodes = new CallGraphNodes(this, includePredicate);

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

  /**
   * @type {GraphDocument}
   */
  get graphDocument() {
    return this.context.graphDocument;
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
      const dp = allApplications.getById(applicationId).dataProvider;
      const context = dp.collections.executionContexts.getById(contextId);
      contextNode = this.getContextNodeByContext(context);
      if (!contextNode) {
        this.buildContextNode(context);
        contextNode = this.getContextNodeByContext(context);
      }
      if (this.graphDocument.state.followMode && contextNode) {
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