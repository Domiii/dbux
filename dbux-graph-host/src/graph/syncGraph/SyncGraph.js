import allApplications from '@dbux/data/src/applications/allApplications';
import GraphMode from '@dbux/graph-common/src/shared/GraphMode';
import SyncGraphBase from '../SyncGraphBase';

class SyncGraph extends SyncGraphBase {
  init() {
    super.init();

    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.state.graphMode === GraphMode.SyncGraph) {
      return true;
    }
    else {
      return false;
    }
  }

  updateRunNodes() {
    const oldAppIds = new Set(this.runNodesById.getApplicationIds());
    const newAppIds = new Set(allApplications.selection.getAll().map(app => app.applicationId));

    // always re-subscribe since applicationSet clears subscribtion everytime it changes
    this._resubscribeOnData();
    this._setApplicationState();

    // remove old runNodes
    for (const runNode of this.runNodesById.getAll()) {
      const { applicationId, runId } = runNode.state;
      if (!newAppIds.has(applicationId)) {
        this.removeRunNode(applicationId, runId);
      }
    }

    // add new runNodes
    for (const appId of newAppIds) {
      if (!oldAppIds.has(appId)) {
        const app = allApplications.getById(appId);
        const allRunIds = app.dataProvider.indexes.executionContexts.byRun.getAllKeys();
        this.updateRunNodeByIds(appId, allRunIds);
      }
    }
  }

  _resubscribeOnData() {
    // unsubscribe old
    this._unsubscribeOnNewData.forEach(f => f());
    this._unsubscribeOnNewData = [];

    // subscribe new
    for (const app of allApplications.selection.getAll()) {
      const { dataProvider: dp } = app;
      const unsubscribes = [
        dp.onData('executionContexts',
          this._handleAddExecutionContexts.bind(this, app)
        ),
        // [future-work]: only subscribe when stats are enabled
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

  _handleAddExecutionContexts = (app, newContexts) => {
    const { applicationId } = app;
    const newRunIds = [...new Set(newContexts.map(c => c.runId))];
    const duplicatedRunIds = newRunIds.filter(runId => {
      return !!this.runNodesById.get(applicationId, runId);
    });
    if (duplicatedRunIds.length) {
      // sanity check: assuming newly incoming data always have a new runId
      this.logger.error(`Received new context(s) of old runIds: [${duplicatedRunIds}]`);
    }
    const newNodes = this.updateRunNodeByIds(applicationId, newRunIds);
    this._setApplicationState();
    this._emitter.emit('newNode', newNodes);
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
}

export default SyncGraph;