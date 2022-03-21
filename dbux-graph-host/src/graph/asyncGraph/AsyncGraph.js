import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import { makeContextLocLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import AsyncNodeDataMap from '@dbux/graph-common/src/graph/types/AsyncNodeDataMap';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import GraphBase from '../GraphBase';
import AsyncGraphNode from './AsyncGraphNode';
import AsyncGraphHoleNode from './AsyncGraphHoleNode';

/** @typedef {import('@dbux/common/src/types/AsyncNode').default} AsyncNode */
/** @typedef {import('@dbux/data/src/applications/Application').default} Application */
/** @typedef {import("@dbux/data/src/RuntimeDataProvider").default } RuntimeDataProvider */

class AsyncGraphNodes {
  constructor(graph) {
    this.graph = graph;
    this.init();
  }

  /**
   * @param {AsyncNode} asyncNode 
   * @returns {boolean}
   */
  isHole(asyncNode) {
    const dp = getDp(asyncNode);
    const { rootContextId } = asyncNode;
    const rootContext = dp.collections.executionContexts.getById(rootContextId);
    return !this.graph.context.graphDocument.includePredicate(rootContext);
  }

  init() {
    /**
     * @type {AsyncGraphNode[]}
     */
    this.all = [];

    /**
     * @type {Map<AsyncNode, AsyncGraphNode>}
     */
    this.nodesByAsyncNode = new Map();
  }

  /**
   * @param {AsyncNode} asyncNode 
   * @return {AsyncGraphNode | AsyncGraphHoleNode}
   */
  get(asyncNode) {
    return this.nodesByAsyncNode.get(asyncNode);
  }

  getAll() {
    return [...this.all];
  }

  /**
   * Build `AsyncGraphNode` from an `AsyncNode` and (maybe) flood its neighboring nodes.
   * @param {AsyncNode} asyncNode 
   * @return {AsyncGraphNode | AsyncGraphHoleNode}
   */
  add(asyncNode) {
    let newGraphNode;
    const { parentAsyncNode, parentEdgeType } = this.getParent(asyncNode);
    const parentGraphNode = this.nodesByAsyncNode.get(parentAsyncNode);
    if (this.isHole(asyncNode)) {
      // try extend
      const extendedHoleNode = this.tryExtendHole(asyncNode);
      if (extendedHoleNode) {
        // neighboring hole exists, extend the old hole
      }
      else {
        // otherwise, create a new hole
        const asyncNodes = [asyncNode];
        const frontier = [];

        this.floodHole(asyncNodes, frontier, asyncNode);

        newGraphNode = new AsyncGraphHoleNode(asyncNodes, frontier, parentGraphNode, parentEdgeType);
        asyncNodes.forEach((node) => this.nodesByAsyncNode.set(node, newGraphNode));
      }
    }
    else {
      newGraphNode = new AsyncGraphNode(asyncNode, parentGraphNode, parentEdgeType);
      this.nodesByAsyncNode.set(asyncNode, newGraphNode);
    }

    if (newGraphNode) {
      this.all.push(newGraphNode);
    }

    return newGraphNode;
  }

  maybeAdd(asyncNode) {
    if (!this.nodesByAsyncNode.get(asyncNode)) {
      return this.add(asyncNode);
    }
    else {
      return null;
    }
  }

  /**
   * Try extend from parent or left sibling
   * @param {AsyncNode} asyncNode 
   * @returns {AsyncGraphHoleNode | null} The extended AsyncGraphHoleNode.
   */
  tryExtendHole(asyncNode) {
    // 1. try extend from parent
    const { parentAsyncNode } = this.getParent(asyncNode);
    const parentGraphNode = this.nodesByAsyncNode.get(parentAsyncNode);
    if (parentGraphNode?.isHole) {
      this.extendHole(parentGraphNode, asyncNode);
      return parentGraphNode;
    }

    // 2. try extend from left sibling
    const siblingAsyncNodes = this.getSiblings(asyncNode);
    const siblingIndex = siblingAsyncNodes.indexOf(asyncNode);
    const leftIndex = siblingIndex - 1;
    if (leftIndex >= 0) {
      const leftAsyncNode = siblingAsyncNodes[leftIndex];
      const leftGraphNode = this.nodesByAsyncNode.get(leftAsyncNode);
      if (leftGraphNode.isHole) {
        this.extendHole(leftGraphNode, asyncNode);
        return leftGraphNode;
      }
    }

    // 3. no hole to extend
    return null;
  }

  extendHole(holeNode, asyncNode) {
    // TODO-M: update hole if needed
    const { asyncNodes, frontier } = holeNode;
    const originalNodeCounts = asyncNodes.length;
    asyncNodes.push(asyncNode);
    this.floodHole(asyncNodes, frontier, asyncNode, false, true, true);
    const newNodes = asyncNodes.slice(originalNodeCounts);
    newNodes.forEach(_asyncNode => this.nodesByAsyncNode.set(_asyncNode, holeNode));
  }

  floodHole(asyncNodes, frontier, asyncNode, goLeft = true, goRight = true, goDown = true, siblingIndex = undefined) {
    if (goLeft || goRight) {
      const siblings = this.getSiblings(asyncNode);
      siblingIndex = siblingIndex ?? siblings.indexOf(asyncNode);
      if (siblingIndex !== -1) {
        this.graph.logger.error(`Could not look up siblingIndex in Graph Construction for asyncNode:\n  > "${JSON.stringify(asyncNode)}"`);
      }
      else {
        // 1. go left (previous sibling)
        if (goLeft) {
          const leftIndex = siblingIndex - 1;
          if (leftIndex >= 0) {
            const left = siblings[leftIndex];
            if (this.isHole(left)) {
              // add to hole: ←↓
              asyncNodes.push(left);
              this.floodHole(asyncNodes, frontier, left, true, false, true, leftIndex);
            }
          }
        }

        // 2. go right (next sibling)
        if (goRight) {
          const rightIndex = siblingIndex + 1;
          if (rightIndex < siblings.length) {
            const right = siblings[rightIndex];
            if (this.isHole(right)) {
              // add to hole: ↓→
              asyncNodes.push(right);
              this.floodHole(asyncNodes, frontier, right, false, true, true, rightIndex);
            }
          }
        }
      }
    }

    // 3. go down (children)
    if (goDown) {
      const children = this.getChildren(asyncNode);
      // NOTE: Here, we specifically iterate over all children, 
      //      because sibling iteration would stop at the first non-filtered sibling,
      //      while this should go through all.
      for (const child of children) {
        if (this.isHole(child)) {
          // add to hole: ↓
          asyncNodes.push(child);
          this.floodHole(asyncNodes, frontier, child, false, false, true);
        }
        else {
          // NOTE: add all non-hole children to frontier
          frontier.push(child);
        }
      }
    }
  }

  /** ###########################################################################
   * Graph traversal helper
   *  #########################################################################*/

  getParent(asyncNode) {
    const dp = getDp(asyncNode);
    const { rootContextId } = asyncNode;

    const firstEdge = dp.indexes.asyncEvents.to.getFirst(rootContextId);
    const parentAsyncNode = dp.util.getAsyncNode(firstEdge?.fromRootContextId);
    return { parentAsyncNode, parentEdgeType: firstEdge?.type };
  }

  getChildren(asyncNode) {
    const dp = getDp(asyncNode);
    const { rootContextId } = asyncNode;

    const edges = dp.indexes.asyncEvents.from.get(rootContextId) || EmptyArray;
    const childAsyncNodes = edges.map(edge => dp.util.getAsyncNode(edge.toRootContextId));
    return childAsyncNodes;
  }

  getSiblings(asyncNode) {
    const dp = getDp(asyncNode);
    const { parentAsyncNode } = this.getParent(asyncNode);
    if (parentAsyncNode) {
      const siblings = this.getChildren(parentAsyncNode);
      return siblings;
    }
    else {
      return dp.util.getRootAsyncNodes();
    }
  }
}

export default class AsyncGraph extends GraphBase {
  init() {
    this.state.applications = [];
    // this.state.ascendingMode = false;
    this.state.ascendingMode = true;
    this.nodes = new AsyncGraphNodes(this);
    this._unsubscribeOnNewData = [];

    this.controllers.createComponent('PopperController');

    this.addDisposable(
      allApplications.selection.data.threadSelection.onSelectionChanged(() => {
        this.owner.refreshGraph();
      })
    );
  }

  shouldBeEnabled() {
    const { graphMode, stackMode } = this.context.graphDocument.state;
    if (graphMode === GraphType.AsyncGraph && stackMode !== StackMode.FullScreen) {
      return true;
    }
    else {
      return false;
    }
  }

  handleRefresh() {
    this._resubscribeOnData();
    const children = this.makeAsyncGraphNodes();
    const applications = this.makeApplicationState(allApplications.selection.getAll());
    const { selectedApplicationId, selected } = allApplications.selection.data.threadSelection;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds: Array.from(selected) });
    this.postUpdate();
  }

  clear() {
    const children = EmptyArray;
    const applications = EmptyArray;
    const selectedApplicationId = null;
    const selectedThreadIds = EmptyArray;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds });
  }

  /** ###########################################################################
   * data
   *  #########################################################################*/

  makeAsyncGraphNodes() {
    const appData = allApplications.selection.data;
    const asyncNodes = appData.asyncNodesInOrder.getAllActual();

    this.nodes.init();
    for (const asyncNode of asyncNodes) {
      this.nodes.maybeAdd(asyncNode);
    }

    let childrenData = this.nodes.getAll().map((asyncGraphNode) => {
      // if (appData.threadSelection.isActive()) {
      //   if (!this.isRelevantAsyncNode(asyncNode)) {
      //     return null;
      //   }
      // }

      return asyncGraphNode.serialize();
    }).filter(n => !!n);

    const dataByNodeMap = new AsyncNodeDataMap();
    childrenData.forEach(childData => dataByNodeMap.add(childData));

    childrenData = this.resolvePositionData(childrenData, dataByNodeMap);
    childrenData = this.resolveErrorData(childrenData, dataByNodeMap);

    return childrenData;
  }

  /**
   * Resolve `rowId`, `colId` and `width`.
   */
  resolvePositionData(asyncNodeData, dataByNodeMap) {
    // rowId
    asyncNodeData.forEach((childData, index) => {
      childData.rowId = index + 1;
    });

    // width
    asyncNodeData.forEach((nodeData) => {
      this.getAsyncNodeWidthDown(nodeData, dataByNodeMap);
      this.getAsyncNodeWidthUp(nodeData, dataByNodeMap);
      nodeData.width = Math.max(nodeData.widthDown, nodeData.widthUp, 1);
    });

    // colId
    /**
     * First, find `inBlockOffset`, `blockRootId(use root asyncNodeId)`:
     *  if fork: return 0; and record as root
     *  if chain: return parent.inBlockOffset + parent.childOffset
     */
    const blockRoots = [];
    asyncNodeData.forEach((childData) => {
      const { parentEdgeType, parentAsyncNodeId, asyncNode: { applicationId, asyncNodeId } } = childData;
      childData.childOffset = 0;
      if (!parentEdgeType) {
        childData.inBlockOffset = 0;
        childData.blockRootId = asyncNodeId;
        blockRoots.push(childData);
      }
      else if (AsyncEdgeType.is.Chain(parentEdgeType)) {
        const parentAsyncData = dataByNodeMap.get(applicationId, parentAsyncNodeId);
        childData.inBlockOffset = parentAsyncData.inBlockOffset + parentAsyncData.childOffset;
        childData.blockRootId = parentAsyncData.blockRootId;
        parentAsyncData.childOffset += childData.width;
      }
      else if (AsyncEdgeType.is.Fork(parentEdgeType)) {
        const parentAsyncData = dataByNodeMap.get(applicationId, parentAsyncNodeId);
        childData.inBlockOffset = 0;
        childData.blockRootId = asyncNodeId;
        blockRoots.push(childData);
        childData.lastForkSiblingNodeId = parentAsyncData.lastForkChildNodeId;
        parentAsyncData.lastForkChildNodeId = asyncNodeId;
      }
      else {
        this.logger.error(`ParentEdge of type "${AsyncEdgeType.nameFrom(parentEdgeType)}" not supported.`);
        childData.inBlockOffset = 0;
        childData.blockRootId = asyncNodeId;
      }
    });

    /**
     * Second, find `blockOffset` using `root.width`
     */
    let currentBlockOffset = 0;
    blockRoots.forEach((root) => {
      root.blockOffset = currentBlockOffset;
      currentBlockOffset += root.width;
    });

    /**
     * Finally, find `colId` by the above:
     */
    asyncNodeData.forEach(childData => {
      const { blockRootId, asyncNode: { applicationId } } = childData;
      const parentAsyncData = dataByNodeMap.get(applicationId, blockRootId);
      if (!parentAsyncData) {
        this.logger.error(`parentAsyncData not found in AsyncGraph.resolvePositionData: ${JSON.stringify({ applicationId, blockRootId })}`);
      }
      childData.colId = (parentAsyncData?.blockOffset || 0) + childData.inBlockOffset + 1;
    });

    return asyncNodeData;
  }

  resolveErrorData(asyncNodeData, dataByNodeMap) {
    const rootErrors = this.componentManager.externals.globalAnalysisViewController.errorTraceManager.getLeaves();
    for (const rootErrorTrace of rootErrors) {
      const { applicationId, rootContextId } = rootErrorTrace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const { asyncNodeId } = dp.indexes.asyncNodes.byRoot.getUnique(rootContextId);
      const nodeData = dataByNodeMap.get(applicationId, asyncNodeId);
      nodeData.hasError = true;
    }

    return asyncNodeData;
  }

  getContextStats({ applicationId, contextId }) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const stats = dp.queries.statsByContext(contextId);
    return {
      nTreeFileCalled: stats.nTreeFileCalled,
      nTreeStaticContexts: stats.nTreeStaticContexts,
      nTreeContexts: stats.nTreeContexts,
      nTreeTraces: stats.nTreeTraces,
      nTreePackages: stats.nTreePackages,
    };
  }

  getAsyncNodeWidthDown(nodeData, dataByNodeMap) {
    if (!nodeData.widthDown) {
      const { applicationId, rootContextId } = nodeData.asyncNode;
      const dp = allApplications.getById(applicationId).dataProvider;
      const outChains = dp.util.getChainFrom(rootContextId);
      const widthDown = outChains
        .map(chain => {
          const toNode = dp.util.getAsyncNode(chain.toRootContextId);
          return dataByNodeMap.getByNode(toNode);
        })
        .reduce((sum, nextNodeData) => {
          return sum + this.getAsyncNodeWidthDown(nextNodeData, dataByNodeMap);
        }, 0);

      nodeData.widthDown = Math.max(widthDown, 1);
    }
    return nodeData.widthDown;
  }

  getAsyncNodeWidthUp(nodeData, dataByNodeMap) {
    if (!nodeData.widthUp) {
      const { applicationId, rootContextId } = nodeData.asyncNode;
      const dp = allApplications.getById(applicationId).dataProvider;
      const inChains = dp.util.getChainTo(rootContextId);
      const widthUp = inChains
        .map(chain => {
          const fromNode = dp.util.getAsyncNode(chain.fromRootContextId);
          return dataByNodeMap.getByNode(fromNode);
        })
        .reduce((sum, nextNodeData) => {
          return sum + this.getAsyncNodeWidthUp(nextNodeData, dataByNodeMap);
        }, 0);
      nodeData.widthUp = Math.max(widthUp, 1);
    }
    return nodeData.widthUp;
  }

  /**
   * @param {Application[]} apps 
   */
  _resubscribeOnData() {
    // unsubscribe old
    this._unsubscribeOnNewData.forEach(f => f());
    this._unsubscribeOnNewData = [];

    // subscribe new
    for (const app of allApplications.selection.getAll()) {
      const { dataProvider: dp } = app;
      const unsubscribes = [
        dp.onData('asyncNodes',
          () => {
            this.refresh();
          }
        ),
        dp.queryImpl.statsByContext.subscribe()
      ];

      // unsubscribe on refresh
      this._unsubscribeOnNewData.push(...unsubscribes);
      // also when application is deselected
      allApplications.selection.subscribe(...unsubscribes);
      // also when node is disposed
      this.addDisposable(...unsubscribes);
    }
  }

  /** ###########################################################################
   * `onSelectionChanged` handlers
   *  #########################################################################*/

  updateRootValueLabel = async (trace) => {
    if (trace) {
      const { applicationId, staticTraceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const firstTraces = new Map();
      const allTraces = dp.indexes.traces.byStaticTrace.get(staticTraceId);
      allTraces.forEach((t) => {
        if (!firstTraces.has(t.rootContextId)) {
          firstTraces.set(t.rootContextId, t);
        }
      });
      const values = Array.from(firstTraces.values()).map(t => {
        const { traceId, rootContextId } = t;
        const { asyncNodeId } = dp.util.getAsyncNode(rootContextId);
        const label = dp.util.getTraceValueStringShort(traceId);

        return {
          applicationId,
          asyncNodeId,
          label,
          valueTraceId: traceId,
        };
      });
      await this.remote.updateRootValueLabel(values);
    }
    else {
      await this.remote.updateRootValueLabel();
    }
  }

  updateStackHighlight = async (trace) => {
    let nodes = [];
    if (trace) {
      const { applicationId, traceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      nodes = dp.util.getAsyncStackContexts(traceId)
        .map(context => dp.util.getAsyncNode(context.contextId))
        .filter(x => !!x);
    }
    await this.remote.highlightStack(nodes);
  }

  updateSyncRootsHighlight = async (trace) => {
    let nodes = EmptyArray;
    if (trace) {
      const { applicationId, rootContextId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      nodes = Array.from(dp.util.getAllSyncRoots(rootContextId))
        .map(context => dp.util.getAsyncNode(context.contextId))
        .filter(x => !!x);
    }
    await this.remote.highlightSyncRoots(nodes);
  }

  updateSelectedAsyncNode = async (trace) => {
    let asyncNode;
    if (trace) {
      const { applicationId, rootContextId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      asyncNode = dp.indexes.asyncNodes.byRoot.getFirst(rootContextId);
      if (this.context.graphDocument.state.followMode && asyncNode) {
        await this.remote.focusAsyncNode(asyncNode);
      }
    }
    await this.remote.selectAsyncNode(asyncNode);
  }

  /**
   * Do view updates that depends on `TraceSelection`.
   */
  postUpdate = async () => {
    try {
      const trace = traceSelection.selected;
      await this.waitForRender();
      await Promise.all([
        // TODO-M: bring this back
        // this.updateStackHighlight(trace),
        // this.updateSyncRootsHighlight(trace),
        // this.updateRootValueLabel(trace),
        // this.updateSelectedAsyncNode(trace),
      ]);
    }
    catch (err) {
      this.logger.error(`postUpdate failed`, err);
    }
  }

  handleTraceSelected = async () => {
    await this.postUpdate();
  }

  // ###########################################################################
  // util
  // ###########################################################################

  async waitForRender() {
    const { asyncGraphContainer } = this.context.graphDocument;
    await asyncGraphContainer.graph.waitForRefresh();
    await asyncGraphContainer.graph.waitForUpdate();
  }

  isRelevantAsyncNode(asyncNode) {
    const { threadSelection } = allApplications.selection.data;
    if (threadSelection.isNodeSelected(asyncNode)) {
      return true;
    }
    const { applicationId, rootContextId } = asyncNode;
    const dp = allApplications.getById(applicationId).dataProvider;
    const toEdges = dp.indexes.asyncEvents.from.get(rootContextId) || EmptyArray;
    for (const edge of toEdges) {
      const threadId = dp.util.getAsyncRootThreadId(edge.toRootContextId);
      if (threadSelection.isSelected(applicationId, threadId)) {
        return true;
      }
    }
    const fromEdges = dp.indexes.asyncEvents.to.get(rootContextId) || EmptyArray;
    for (const edge of fromEdges) {
      const threadId = dp.util.getAsyncRootThreadId(edge.fromRootContextId);
      if (threadSelection.isSelected(applicationId, threadId)) {
        return true;
      }
    }
    return false;
  }

  shared() {
    return {
      context: {
        graphRoot: this,
      }
    };
  }

  public = {
    selectTrace(applicationId, traceId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTrace(traceId);
      if (trace) {
        traceSelection.selectTrace(trace);
      }
    },
    gotoAsyncNode(applicationId, asyncNodeId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTraceOfAsyncNode(asyncNodeId);
      if (trace) {
        traceSelection.selectTrace(trace);
      }
    },
    gotoValueTrace(applicationId, valueTraceId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTrace(valueTraceId);
      if (trace) {
        traceSelection.selectTrace(trace);
      }
    },
    selectSyncInThreads(applicationId, asyncNodeId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
      const syncInThreads = dp.indexes.asyncEvents.syncInByRoot.get(asyncNode.rootContextId);
      const syncInThreadIds = syncInThreads.map(event => {
        return dp.indexes.asyncNodes.byRoot.getUniqueNotNull(event.fromRootContextId).threadId;
      });
      syncInThreadIds.push(asyncNode.threadId);
      allApplications.selection.data.threadSelection.select(applicationId, syncInThreadIds);
    },
    selectSyncOutThreads(applicationId, asyncNodeId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
      const syncOutThreads = dp.indexes.asyncEvents.syncOutByRoot.get(asyncNode.rootContextId);
      const syncOutThreadIds = syncOutThreads.map(event => {
        return dp.indexes.asyncNodes.byRoot.getUniqueNotNull(event.toRootContextId).threadId;
      });
      syncOutThreadIds.push(asyncNode.threadId);
      allApplications.selection.data.threadSelection.select(applicationId, syncOutThreadIds);
    },
    selectRelevantThread(applicationId, threadId) {
      this.componentManager.externals.alert('Thread selection is currently disabled.', false);
      // allApplications.selection.data.threadSelection.select(applicationId, [threadId]);
    },
    async selectError(applicationId, rootContextId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const firstError = dp.indexes.traces.errorByRoot.getFirst(rootContextId);
      if (firstError) {
        traceSelection.selectTrace(firstError);
        await this.componentManager.externals.globalAnalysisViewController.revealSelectedError();
      }
      else {
        this.componentManager.externals.alert('No error in this async node.', false);
      }
    }
  }
}

/** ###########################################################################
 * util
 *  #########################################################################*/

/**
 * @param {{ applicationId:number }} applicationIdHolder 
 * @returns {RuntimeDataProvider}
 */
function getDp(applicationIdHolder) {
  return allApplications.getById(applicationIdHolder.applicationId).dataProvider;
}