import EmptyArray from '@dbux/common/src/util/EmptyArray';
import AsyncEdgeType from '@dbux/common/src/types/constants/AsyncEdgeType';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import { makeContextLocLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import AsyncNodeDataMap from '@dbux/graph-common/src/shared/AsyncNodeDataMap';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
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
    if (this.context.graphDocument.state.graphMode === GraphType.AsyncGraph) {
      return true;
    }
    else {
      return false;
    }
  }

  handleRefresh() {
    const children = this.makeChildrenData();
    const applications = this.makeApplicationState(allApplications.selection.getAll());
    const { selectedApplicationId, selected } = allApplications.selection.data.threadSelection;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds: Array.from(selected) });
    this._resubscribeOnData();
  }

  clear() {
    const children = EmptyArray;
    const applications = EmptyArray;
    const selectedApplicationId = null;
    const selectedThreadIds = EmptyArray;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds });
  }

  makeChildrenData() {
    const appData = allApplications.selection.data;
    const asyncNodes = appData.asyncNodesInOrder.getAllActual();

    const childrenData = asyncNodes.map((asyncNode) => {
      const { applicationId, rootContextId, threadId, asyncNodeId } = asyncNode;

      if (appData.threadSelection.isActive()) {
        if (!this.isRelevantAsyncNode(asyncNode)) {
          return null;
        }
      }

      const app = allApplications.getById(applicationId);
      const dp = app.dataProvider;
      const context = dp.collections.executionContexts.getById(rootContextId);
      const displayName = makeContextLabel(context, app);
      const locLabel = makeContextLocLabel(applicationId, context);
      const syncInCount = dp.indexes.asyncEvents.syncInByRoot.getSize(rootContextId);
      const syncOutCount = dp.indexes.asyncEvents.syncOutByRoot.getSize(rootContextId);
      const realStaticContextid = dp.util.getRealContextOfContext(rootContextId).staticContextId;
      const moduleName = dp.util.getContextModuleName(rootContextId);

      const firstNode = dp.indexes.asyncNodes.byThread.getFirst(threadId);
      const parentEdge = dp.indexes.asyncEvents.to.getFirst(rootContextId);
      const parentEdgeType = parentEdge?.edgeType;
      const parentAsyncNode = dp.util.getAsyncNode(parentEdge?.fromRootContextId);
      const parentAsyncNodeId = parentAsyncNode?.asyncNodeId;
      let parentRowId;
      if (firstNode.asyncNodeId === asyncNodeId) {
        parentRowId = parentAsyncNode && appData.asyncNodesInOrder.getIndex(parentAsyncNode);
      }

      return {
        asyncNode,
        displayName,
        locLabel,
        syncInCount,
        syncOutCount,
        parentEdgeType,
        parentAsyncNodeId,
        parentRowId,

        realStaticContextid,
        moduleName
      };
    }).filter(n => !!n);

    return this.resolvePositionData(childrenData);
  }

  /**
   * Resolve `rowId`, `colId` and `width`.
   */
  resolvePositionData(asyncNodeData) {
    const dataByNodeMap = new AsyncNodeDataMap();
    asyncNodeData.forEach(childData => dataByNodeMap.add(childData));

    // rowId
    asyncNodeData.forEach((childData, index) => {
      childData.rowId = index + 1;
    });

    // width
    asyncNodeData.forEach((childData) => {
      childData.width = this.getAsyncNodeWidth(childData, dataByNodeMap);
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
        childData.inBlockOffset = 0;
        childData.blockRootId = asyncNodeId;
        blockRoots.push(childData);
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
        debugger;
      }
      childData.colId = parentAsyncData.blockOffset + childData.inBlockOffset;
    });

    return asyncNodeData;
  }

  getAsyncNodeWidth(nodeData, dataByNodeMap) {
    if (!nodeData.width) {
      const { applicationId, rootContextId } = nodeData.asyncNode;
      const dp = allApplications.getById(applicationId).dataProvider;
      const outChain = dp.util.getChainFrom(rootContextId);
      const childWidth = outChain
        .map(chain => {
          const toAsyncNode = dp.util.getAsyncNode(chain.toRootContextId);
          return dataByNodeMap.getByNode(toAsyncNode);
        })
        .reduce((sum, childNodeData) => {
          return sum + this.getAsyncNodeWidth(childNodeData, dataByNodeMap);
        }, 0);
      nodeData.width = Math.max(childWidth, 1);
    }
    return nodeData.width;
  }

  makeApplicationState(apps = EmptyArray) {
    const applications = apps.map(app => ({
      applicationId: app.applicationId,
      entryPointPath: app.entryPointPath,
      name: app.getPreferredName()
    }));
    return { applications };
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
      const { dataProvider } = app;
      const unsubscribe = dataProvider.onData('asyncNodes',
        () => {
          this.refresh();
        }
      );

      // future-work: avoid potential memory leak
      allApplications.selection.subscribe(unsubscribe);
      this.addDisposable(unsubscribe);
      this._unsubscribeOnNewData.push(unsubscribe);
    }
  }

  updateStackHighlight = async (trace) => {
    let nodes = [];
    if (trace) {
      const { applicationId, traceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      nodes = dp.util.getAsyncStackRoots(traceId)
        .map(context => dp.util.getAsyncNode(context.contextId))
        .filter(x => !!x);
    }
    await this.remote.highlightStack(nodes);
  }

  handleTraceSelected = async (trace) => {
    // goto async node of trace
    await this.waitForRender();
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
    await this.updateStackHighlight(trace);
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
    }
  }
}

export default AsyncGraph;