import NanoEvents from 'nanoevents';
import minBy from 'lodash/minBy';
import difference from 'lodash/difference';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import GraphBase from './GraphBase';
import ContextNode from './syncGraph/ContextNode';
import HoleNode from './syncGraph/HoleNode';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef { import("./GraphDocument").default } GraphDocument */
/** @typedef { import("@dbux/data/src/RuntimeDataProvider").default } RuntimeDataProvider */
/** @typedef {import('@dbux/common/src/types/ExecutionContext').default} ExecutionContext */

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('SyncGraphBase');

const Verbose = 0;
// const Verbose = 1;

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

  _sharedData = null;

  constructor(id, contexts, frontier) {
    this.id = id;
    this.contexts = contexts;
    this.frontier = frontier;

    this.updateHoleData();
  }

  updateHoleData() {
    this.contextIds = this.contexts.map(c => c.contextId);
    this._sharedData = null;
  }

  makeSharedData() {
    return this._sharedData || (this._sharedData = {
      contextCount: this.contexts.length
    });
  }
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
   * @type {Map<ExecutionContext, ContextNode | HoleNode>}
   */
  contextNodesByContext;

  _lastHoldeId = 0;
  holeNodesById = [];

  constructor(graph) {
    this.graph = graph;

    this.clear();
  }

  /**
   * Decides whether the given context should be displayed or "is part of a hole".
   * 
   * @type {(context) => Boolean}
   */
  includePredicate(context) {
    return this.graph.context.graphDocument.contextFilterManager.includePredicate(context);
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

  isHole = (context) => {
    return !this.includePredicate(context);
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

    // if (context.contextId === 1) {
    //   console.debug(`[flood] ${context.contextId} ${goUp && '↑' || ''}${goLeft && '←' || ''}${goDown && '↓' || ''}${goRight && '→' || ''}`);
    // }

    parentContext = (parentContext === undefined ?
      (!dp.util.isRootContext(context.contextId) && dp.collections.executionContexts.getById(context.parentContextId)) :
      parentContext)
      || null;

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
   * {@link tryExtendHole}
   * ##########################################################################*/

  /**
   * In some cases we want to extend an existing, rather than create a new, hole.
   * This currently only applies to CGRs whose previous sibling was already part of a hole.
   * @return {{ holeNode: HoleNode, newContexts: ExecutionContext[] }}
   */
  tryExtendHole(context) {
    const dp = getDp(context);
    if (dp.util.isRootContext(context.contextId)) {
      const roots = this.graph.getAllRootContexts();
      const index = roots.indexOf(context);
      const previousRoot = roots[index - 1];
      if (previousRoot && this.isHole(previousRoot)) {
        /**
         * @type {HoleNode}
         */
        const hole = this.graph.getContextNodeByContext(previousRoot);
        if ((hole instanceof HoleNode)) {
          const { contexts, frontier } = hole.group;
          const nContexts = contexts.length;
          contexts.push(context);
          this.floodHole(contexts, frontier, context, false, false, true, true, null, index);
          return { holeNode: hole, newContexts: contexts.slice(nContexts) };
        }
        else {
          this.graph.logger.warn(`Previous root of hole context was also in hole, but had no HoleNode: ${dp.util.makeContextInfo(previousRoot)}`);
        }
      }
    }


    return null;
  }

  /** ###########################################################################
   * {@link #add}
   * ##########################################################################*/

  /**
   * @param {HostComponentEndpoint} parentNode 
   */
  add(parentNode, context) {
    const dp = getDp(context);
    if (Verbose) {
      const nAncestors = dp.util.getContextAncestorCountInRoot(context.contextId);
      this.graph.logger.debug(`[add] ${' '.repeat(nAncestors)}${dp.util.makeContextInfo(context)}`);
    }

    if (this.getContextNodeByContext(context)) {
      // NOTE: this can happen if this is a "hole sibling" (hole was added when previous sibling was added, but hole includes this context)
      // const dp = getDp(context);
      // this.graph.logger.warn(`Tried to add ContextNode but Node already exist for context: ${dp.util.makeContextInfo(context)}`);
      return null;
    }

    /**
     * @type {ContextNode | HoleNode}
     */
    let node;
    if (this.isHole(context)) {
      const extendResult = this.tryExtendHole(context);
      /**
       * @type {ExecutionContext[]}
       */
      let newContexts;
      if (extendResult) {
        ({ holeNode: node, newContexts } = extendResult);
        // update existing hole
        node.group.updateHoleData();
        node.setState({
          group: node.group.makeSharedData()
        });
      }
      else {
        newContexts = [];
        const frontier = [];
        newContexts.push(context);

        this.floodHole(newContexts, frontier, context);

        // create new hole
        const group = this.createHole(newContexts, frontier);
        const state = {
          // future-work: HoleNodes dont actually have a single representative `context`
          context: minBy(newContexts, c => c.contextId),
          group: group.makeSharedData()
        };
        const hostOnlyState = {
          group
        };
        node = parentNode.children.createComponent('HoleNode', state, hostOnlyState);
      }
      for (const c of newContexts) {
        // associate all contexts with the node
        this.contextNodesByContext.set(c, node);
      }
    }
    else {
      node = parentNode.children.createComponent('ContextNode', {
        context,
      });
      this.contextNodesByContext.set(context, node);
    }

    node.addDisposable(() => {
      this._handleContextNodeDisposed(node);
    });

    return node;
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

  /**
   * remove disposed node from `this.contextNodesByContext`
   * @param {ContextNode | HoleNode} node 
   */
  _handleContextNodeDisposed = (node) => {
    let contexts;
    if (node instanceof HoleNode) {
      contexts = node.group.contexts;
    }
    else if (node instanceof ContextNode) {
      contexts = [node.state.context];
    }
    else {
      throw new Error(`Calling "_handleContextNodeDisposed" with non-ContextNode parameter: ${node}`);
    }

    for (const context of contexts) {
      if (this.getContextNodeByContext(context) === node) {
        this.contextNodesByContext.delete(context);
      }
    }
  }

  delete(context) {
    const contextNode = this.getContextNodeByContext(context);
    // NOTE: sometimes, `contextNode` does not exist, for some reason
    //    -> might be because `this.roots` contains roots that are not actually displayed
    //    -> or many context may shared the same HoleNode
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
   * @type {ExecutionContext[]}
   */
  roots;

  /**
   * @type {CallGraphNodes}
   */
  _nodes;

  init() {
    this._nodes = new CallGraphNodes(this);

    this.roots = [];
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

  async handleRefresh() {
    this.updateAllRoots();

    await this.waitForAllChildren();

    // force update collapse/expand state
    const graphNode = this.controllers.getComponent('GraphNode');
    if (graphNode.state.mode !== GraphNodeMode.Collapsed) {
      graphNode.setMode(graphNode.state.mode, true);
    }
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
    this.roots = [];
    return this._nodes.clear();
  }

  // ###########################################################################
  // Context Node management
  // ###########################################################################

  /**
   * 
   */
  updateAllRoots() {
    const allRoots = this.getAllRootContexts();
    const newRoots = allRoots;
    const oldRoots = this.roots;

    const removedRoots = difference(oldRoots, newRoots);
    const addedRoots = difference(newRoots, oldRoots);

    // always re-subscribe since applicationSet clears subscribtion everytime it changes
    this._resubscribeOnData();

    // remove old roots
    for (const root of removedRoots) {
      this._removeContextNode(root);
    }

    // add new roots
    for (const root of addedRoots) {
      this._addRoot(root);
    }

    // // remove new roots if exists as an old children, then re-add (serves as a refresh)
    // for (const root of addedRoots) {
    //   const node = this.getContextNodeByContext(root);
    //   if (node) {
    //     if (oldRoots.has(root)) {
    //       continue;
    //     }
    //     else {
    //       this._removeContextNode(root);
    //     }
    //   }
    //   this._addRoot(root);
    // }

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
   * Find a `ContextNode`.
   *  @return {ContextNode | HoleNode}
   */
  getContextNodeByContext = (context) => {
    return this._nodes.getContextNodeByContext(context);
  }

  /**
   * Find or create a `ContextNode`.
   *  @return {ContextNode | HoleNode}
   */
  getOrCreateContextNodeByContext = (context) => {
    return this.getContextNodeByContext(context) || this.buildContextNode(context);
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

  /**
   * Basically a `forceUpdate()` with `state.applications` updated
   */
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