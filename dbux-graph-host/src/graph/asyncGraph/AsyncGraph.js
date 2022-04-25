import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import { makeContextLocLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import AsyncNodeDataMap from '@dbux/graph-common/src/graph/types/AsyncNodeDataMap';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import GraphBase from '../GraphBase';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncGraph extends GraphBase {
  init() {
    this.state.applications = [];
    // this.state.ascendingMode = false;
    this.state.ascendingMode = true;
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
    const children = this.makeChildrenData();
    const applications = this.makeApplicationState(allApplications.selection.getAll());
    const { selectedApplicationId, selected } = allApplications.selection.data.threadSelection;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds: Array.from(selected) });
    // this.viewUpdate();
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

  makeChildrenData() {
    const appData = allApplications.selection.data;
    const asyncNodes = appData.asyncNodesInOrder.getAllActual();

    let childrenData = asyncNodes.map((asyncNode) => {
      const { applicationId, rootContextId } = asyncNode;

      // if (appData.threadSelection.isActive()) {
      //   if (!this.isRelevantAsyncNode(asyncNode)) {
      //     return null;
      //   }
      // }

      const app = allApplications.getById(applicationId);
      const dp = app.dataProvider;
      const executionContext = dp.collections.executionContexts.getById(rootContextId);
      const displayName = makeContextLabel(executionContext, app);
      const locLabel = makeContextLocLabel(applicationId, executionContext);
      const syncInCount = dp.indexes.asyncEvents.syncInByRoot.getSize(rootContextId);
      const syncOutCount = dp.indexes.asyncEvents.syncOutByRoot.getSize(rootContextId);

      const isProgramRoot = dp.util.isContextProgramContext(rootContextId);
      const realStaticContextid = dp.util.getRealContextOfContext(rootContextId).staticContextId;
      const packageName = dp.util.getContextPackageName(rootContextId);
      const postAsyncEventUpdate = dp.util.getAsyncPostEventUpdateOfRoot(rootContextId);
      const postAsyncEventUpdateType = postAsyncEventUpdate?.type;

      const parentEdges = (dp.indexes.asyncEvents.to.get(rootContextId) || EmptyArray)
        .map(edge => {
          const parentAsyncNode = dp.util.getAsyncNode(edge.fromRootContextId);
          return {
            edgeType: edge.edgeType,
            parentAsyncNodeId: parentAsyncNode.asyncNodeId
          };
        });
      // assuming all incoming edges of a node have same `edgeType`, so we can just take the first one
      const parentEdge = parentEdges[0];
      const parentEdgeType = parentEdge?.edgeType;
      const parentAsyncNodeId = parentEdge?.parentAsyncNodeId;
      const nestingDepth = dp.util.getNestedDepth(rootContextId);

      const stats = this.getContextStats(executionContext);

      return {
        asyncNode,
        executionContext,

        displayName,
        locLabel,
        syncInCount,
        syncOutCount,
        parentEdges,
        parentEdgeType,
        parentAsyncNodeId,
        nestingDepth,

        isProgramRoot,
        realStaticContextid,
        packageName,
        postAsyncEventUpdateType,
        stats,

        /**
         * dummy value, will be resolve later in `resolveErrorData`
         */
        hasError: false,
      };
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

  update() {
    this.registerViewUpdate();
  }

  /**
   * Do view updates that depends on `TraceSelection`.
   */
  registerViewUpdate = async () => {
    if (!this.graphContainer.isEnabled()) {
      return;
    }

    try {
      const trace = traceSelection.selected;
      await this.waitForRender();
      await Promise.all([
        this.updateStackHighlight(trace),
        this.updateSyncRootsHighlight(trace),
        this.updateRootValueLabel(trace),
        this.updateSelectedAsyncNode(trace),
      ]);
    }
    catch (err) {
      this.logger.error(`postUpdate failed`, err);
    }
  }

  handleTraceSelected = async () => {
    await this.registerViewUpdate();
  }

  // ###########################################################################
  // util
  // ###########################################################################

  async waitForRender() {
    await this.waitForRefresh();
    await this.waitForUpdate();
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
    gotoAsyncNode(applicationId, asyncNodeId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTraceOfAsyncNode(asyncNodeId);
      if (trace) {
        const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
        traceSelection.selectTrace(trace);
        this.componentManager.externals.emitCallGraphTraceAction(trace, UserActionType.AsyncCallGraphTrace, { asyncNode });
      }
    },
    selectSchedulerTrace(applicationId, asyncNodeId, schedulerTraceId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTrace(schedulerTraceId);
      if (trace) {
        const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
        traceSelection.selectTrace(trace);
        this.componentManager.externals.emitCallGraphTraceAction(trace, UserActionType.AsyncCallGraphSchedulerTrace, { asyncNode });
      }
    },
    gotoValueTrace(applicationId, asyncNodeId, valueTraceId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const trace = dp.util.getTrace(valueTraceId);
      if (trace) {
        const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
        traceSelection.selectTrace(trace);
        this.componentManager.externals.emitCallGraphTraceAction(trace, UserActionType.AsyncCallGraphValueTrace, { asyncNode });
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
    async selectError(applicationId, asyncNodeId, rootContextId) {
      const dp = allApplications.getById(applicationId).dataProvider;
      const firstError = dp.indexes.traces.errorByRoot.getFirst(rootContextId);
      if (firstError) {
        const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
        traceSelection.selectTrace(firstError);
        await this.componentManager.externals.globalAnalysisViewController.revealSelectedError();
        this.componentManager.externals.emitCallGraphTraceAction(firstError, UserActionType.AsyncCallGraphError, { asyncNode });
      }
      else {
        this.componentManager.externals.alert('No error in this async node.', false);
      }
    }
  }
}

export default AsyncGraph;