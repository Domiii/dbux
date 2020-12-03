import NanoEvents from 'nanoevents';
import ExecutionContextType from '@dbux/common/src/core/constants/ExecutionContextType';
import allApplications from '@dbux/data/src/applications/allApplications';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';
import ThreadColumn from './ThreadColumn';

class AsyncGraph extends HostComponentEndpoint {
  init() {
    this.state.applications = [];
    this._emitter = new NanoEvents();
    this._unsubscribeOnNewData = [];

    this.controllers.createComponent('PopperManager');
    this.controllers.createComponent('ZoomBar');
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
        const contexts = app.dataProvider.collections.executionContexts.getAll().slice(1);

        let lastThreadId, nodeCount = 0;
        const nodesByThreadId = new Map();
        for (let i = 0; i < contexts.length; ++i) {
          const { threadId } = contexts[i];
          if (threadId !== lastThreadId) {
            if (!nodesByThreadId.get(threadId)) {
              nodesByThreadId.set(threadId, []);
            }
            nodesByThreadId.get(threadId).push(nodeCount++);
          }
        }

        for (const threadId of nodesByThreadId.keys()) {
          this.children.createComponent(ThreadColumn, {
            applicationId: app.applicationId,
            threadId,
            nodeIds: nodesByThreadId.get(threadId),
            nodeCount,
          });
        }
      }

      this._setApplicationState();
    }
    else {
      this.children.getComponents(ThreadColumn).forEach(comp => comp.dispose());
    }
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