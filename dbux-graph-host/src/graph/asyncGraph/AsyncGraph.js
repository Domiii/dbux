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
    // this.children.getComponents(ThreadColumn).forEach(comp => comp.dispose());

    // const app = allApplications.selection.getAll()?.[0];

    // if (app) {
    //   const dp = app.dataProvider;
    //   const resumeContexts = dp.indexes.executionContexts.byType.get(ExecutionContextType.Resume);
    //   const nodeCount = resumeContexts.length;
    //   const nodesByThreadId = new Map();

    //   for (let order = 0; order < resumeContexts.length; ++order) {
    //     const context = resumeContexts[order];
    //     const { runId } = context;
    //     const { threadId } = dp.collections.runs.getById(runId);

    //     if (!nodesByThreadId.get(threadId)) {
    //       nodesByThreadId.set(threadId, []);
    //     }

    //     nodesByThreadId.get(threadId).push({ order, context });
    //   }

    //   for (const threadId of nodesByThreadId.keys()) {
    //     this.children.createComponent(ThreadColumn, {
    //       applicationId: app.applicationId,
    //       threadId,
    //       nodes: nodesByThreadId.get(threadId),
    //       nodeCount,
    //     });
    //   }
    // }

    // this._setApplicationState();
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

  addThreadNodeByContexts(applicationId, contexts) {
    const runIds = new Set(contexts.map(context => context?.runId || 0));
    const newNodes = [];

    runIds.forEach(runId => {
      if (runId) {
        const newNode = this.addRunNode(applicationId, runId);
        newNodes.push(newNode);
      }
    });

    return newNodes;
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