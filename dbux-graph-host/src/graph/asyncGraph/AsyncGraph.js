import NanoEvents from 'nanoevents';
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
    this.children.getComponents(ThreadColumn).forEach(comp => comp.dispose());
    this.children.createComponent(ThreadColumn, {
      threadId: 1
    });
    this._setApplicationState();
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