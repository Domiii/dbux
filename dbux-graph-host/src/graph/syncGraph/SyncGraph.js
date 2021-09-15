import allApplications from '@dbux/data/src/applications/allApplications';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import SyncGraphBase from '../SyncGraphBase';

class SyncGraph extends SyncGraphBase {
  init() {
    super.init();

    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.state.graphMode === GraphType.SyncGraph) {
      return true;
    }
    else {
      return false;
    }
  }

  updateContextNodes() {
    const roots = allApplications.selection.getAll().map(app => {
      return app.dataProvider.util.getAllRootContexts();
    }).flat();

    this.updateByContexts(roots);
    
    this._setApplicationState();
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
    // TODO-M: use new context node system
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