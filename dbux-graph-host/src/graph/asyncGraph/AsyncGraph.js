import NanoEvents from 'nanoevents';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import { makeContextLocLabel, makeContextLabel } from '@dbux/data/src/helpers/makeLabels';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncGraph extends HostComponentEndpoint {
  init() {
    this.state.applications = [];
    // this.state.ascendingMode = false;
    this.state.ascendingMode = true;
    this._emitter = new NanoEvents();
    this._unsubscribeOnNewData = [];

    this.controllers.createComponent('PopperController');

    // register event listeners
    this.addDisposable(
      allApplications.selection.onApplicationsChanged(() => {
        this.refresh();
        this._resubscribeOnData();
      })
    );
    this.addDisposable(
      allApplications.selection.data.threadSelection.onSelectionChanged(() => {
        this.refresh();
      })
    );

    this.refresh();
  }

  handleRefresh() {
    let children = EmptyArray;
    if (this.context.graphDocument.asyncGraphMode) {
      children = this.makeChildNodes();
    }
    else {
      this.forceUpdate();
    }

    const applications = this.makeApplicationState(allApplications.selection.getAll());
    const { selectedApplicationId, selected } = allApplications.selection.data.threadSelection;
    this.setState({ children, applications, selectedApplicationId, selectedThreadIds: Array.from(selected) });
  }

  makeChildNodes() {
    const appData = allApplications.selection.data;
    const asyncNodes = appData.asyncNodesInOrder.getAllActual();

    // // future-work: allow select threads cross different application
    // let relevantRootContextId;
    // if (appData.threadSelection.isActive()) {
    //   const selectedApp = allApplications.getById(appData.threadSelection.selectedApplicationId);
    //   relevantRootContextId = selectedApp.dp.util.getReleventRootContextIds();
    // }

    return asyncNodes.map((asyncNode, index) => {
      const { applicationId, rootContextId, threadId } = asyncNode;

      if (!rootContextId) {
        // sanity check
        this.logger.warn(`Invalid asyncNode had invalid rootContextId ${asyncNode.rootContextId} -`, asyncNode);
        return null;
      }

      if (appData.threadSelection.isActive()) {
        if (!this.isRelevantAsyncNode(asyncNode)) {
          return null;
        }
      }

      const app = allApplications.getById(applicationId);
      const dp = app.dataProvider;
      const context = dp.collections.executionContexts.getById(rootContextId);
      const rowId = index + 1;
      let colId = appData.asyncThreadsInOrder.getIndex(asyncNode);
      if (!colId) {
        this.logger.warn(`asyncNode not found in asyncThreadsInOrder:`, asyncNode);
        return null;
      }
      const displayName = makeContextLabel(context, app);
      const locLabel = makeContextLocLabel(applicationId, context);
      const syncInCount = dp.indexes.asyncEvents.syncInByRoot.getSize(rootContextId);
      const syncOutCount = dp.indexes.asyncEvents.syncOutByRoot.getSize(rootContextId);

      let parentAsyncNodeId, parentRowId;
      const firstNode = dp.indexes.asyncNodes.byThread.getFirst(threadId);
      if (firstNode.asyncNodeId === asyncNode.asyncNodeId) {
        const parentEdge = dp.indexes.asyncEvents.to.getFirst(firstNode.rootContextId);
        const parentRootContextId = parentEdge?.fromRootContextId;
        const parentAsyncNode = parentRootContextId && dp.indexes.asyncNodes.byRoot.getUnique(parentRootContextId);
        parentAsyncNodeId = parentAsyncNode?.asyncNodeId;
        parentRowId = parentAsyncNode && appData.asyncNodesInOrder.getIndex(parentAsyncNode);
      }

      return {
        asyncNode,
        rowId,
        colId,
        displayName,
        locLabel,
        syncInCount,
        syncOutCount,
        parentAsyncNodeId,
        parentRowId
      };
    }).filter(n => !!n);
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
    // subscribe new
    for (const app of allApplications.selection.getAll()) {
      const { dataProvider } = app;
      const unsubscribe = dataProvider.onData('asyncEventUpdates',
        () => {
          this.refresh();
        }
      );

      // future-work: avoid potential memory leak
      allApplications.selection.subscribe(unsubscribe);
      this.addDisposable(unsubscribe);
    }
  }

  // ###########################################################################
  // util
  // ###########################################################################

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

  // ###########################################################################
  // own event listener
  // ###########################################################################

  on(eventName, cb) {
    this._emitter.on(eventName, cb);
  }

  // ###########################################################################
  // shared
  // ###########################################################################

  shared() {
    return {
      context: {
        asyncGraph: this
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
      const asyncNode = dp.collections.asyncNodes.getById(asyncNodeId);
      const firstTrace = dp.indexes.traces.byContext.getFirst(asyncNode.rootContextId);
      if (firstTrace) {
        traceSelection.selectTrace(firstTrace);
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
      allApplications.selection.data.threadSelection.select(applicationId, [threadId]);
    }
  }
}

export default AsyncGraph;