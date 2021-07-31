import NanoEvents from 'nanoevents';
import allApplications from '@dbux/data/src/applications/allApplications';
import { makeContextLabel } from '@dbux/data/src/helpers/contextLabels';
import { makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/traceLabels';
import KeyedComponentSet from '@dbux/graph-common/src/componentLib/KeyedComponentSet';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
import ThreadColumn from './ThreadColumn';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class ThreadColumnSet extends KeyedComponentSet {
  makeKey(entry) {
    return `${entry.applicationId}_${entry.threadId}`;
  }
}

class AsyncGraph extends HostComponentEndpoint {
  init() {
    this.state.applications = [];
    // this.state.ascendingMode = false;
    this.state.ascendingMode = true;
    this._emitter = new NanoEvents();
    this._unsubscribeOnNewData = [];
    this.threadColumns = new ThreadColumnSet(this, ThreadColumn, { forceUpdate: true });

    this.controllers.createComponent('PopperController');

    // register event listeners
    this.addDisposable(
      allApplications.selection.onApplicationsChanged(() => {
        this.refresh();
      })
    );
    this.addDisposable(
      this.context.graphDocument.onAsyncGraphModeChanged(() => {
        this.refresh();
      })
    );

    this.refresh();
  }

  handleRefresh() {
    if (this.context.graphDocument.asyncGraphMode) {
      const app = allApplications.selection.getAll()?.[0];

      if (app) {
        this.buildChildrenColumns(app);
      }

      this._resubscribeOnData();
    }
    else {
      this.forceUpdate(); // re-render self
      this.threadColumns.update([]);
    }
    this._setApplicationState();
  }

  /**
   * @param {Application} app 
   */
  buildChildrenColumns(app) {
    const { dataProvider: dp, applicationId } = app;
    const threadIds = dp.indexes.asyncNodes.byThread.getAllKeys();
    const rootContextIds = dp.indexes.asyncNodes.byRoot.getAllKeys();
    const lastRootContextId = dp.collections.asyncNodes.getLast()?.rootContextId;

    this.threadColumns.update(threadIds.map((threadId) => {
      const firstNode = dp.indexes.asyncNodes.byThread.getFirst(threadId);
      const parentEdge = dp.indexes.asyncEvents.to.getFirst(firstNode.rootContextId);
      const parentRootContextId = parentEdge?.fromRootContextId;
      const parentAsyncNodeId = parentRootContextId && dp.indexes.asyncNodes.byRoot.getUniqueNotNull(parentRootContextId)?.asyncNodeId;
      return {
        applicationId,
        threadId,
        parentRootContextId,
        parentAsyncNodeId,
        lastRootContextId,
        rootContextIds,
        nodes: this.makeThreadColumnNodes(app, threadId),
      };
    }));
  }

  makeThreadColumnNodes(app, threadId) {
    const { dataProvider: dp, applicationId } = app;
    return dp.indexes.asyncNodes.byThread.get(threadId).map(asyncNode => {
      const trace = dp.collections.traces.getById(asyncNode.traceId);
      const context = dp.collections.executionContexts.getById(asyncNode.rootContextId);
      // const displayName = trace ? makeTraceLabel(trace) : makeContextLabel(context, app);
      const displayName = makeContextLabel(context, app);
      return {
        displayName,
        locLabel: makeContextLocLabel(applicationId, context),
        asyncNode,
        context
      };
    });
  }

  _resubscribeOnData() {
    // unsubscribe old
    this._unsubscribeOnNewData?.forEach(f => f());
    this._unsubscribeOnNewData = [];

    // subscribe new
    for (const app of allApplications.selection.getAll()) {
      const { dataProvider } = app;
      const unsubscribe = dataProvider.onData('executionContexts',
        () => {
          this.refresh();
          this._setApplicationState();
        }
      );
      this._unsubscribeOnNewData.push(unsubscribe);
      allApplications.selection.subscribe(unsubscribe);
      this.addDisposable(unsubscribe);
    }
  }

  _setApplicationState() {
    const update = {
      applications: allApplications.selection.getAll().map(app => ({
        applicationId: app.applicationId,
        entryPointPath: app.entryPointPath,
        name: app.getPreferredName()
      }))
    };
    this.setState(update);
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
}

export default AsyncGraph;