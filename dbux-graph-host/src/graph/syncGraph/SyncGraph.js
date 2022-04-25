import allApplications from '@dbux/data/src/applications/allApplications';
import GraphType from '@dbux/graph-common/src/shared/GraphType';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
import SyncGraphBase from '../SyncGraphBase';

class SyncGraph extends SyncGraphBase {
  init() {
    super.init();

    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');
  }

  shouldBeEnabled() {
    const { graphMode, stackMode } = this.context.graphDocument.state;
    if (graphMode === GraphType.SyncGraph && stackMode !== StackMode.FullScreen) {
      return true;
    }
    else {
      return false;
    }
  }

  /**
   * @return {Array.<ExecutionContext>} All root contexts participating in this graph.
   */
  getAllRootContexts() {
    const roots = allApplications.selection.getAll().map(app => {
      return app.dataProvider.util.getAllRootContexts();
    }).flat();

    return roots;
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
    this.refresh();
  }
}

export default SyncGraph;