import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import SyncGraphBase from '../SyncGraphBase';

/** @typedef {import('@dbux/data/src/applications/Application').default} Application */

class AsyncStack extends SyncGraphBase {
  init() {
    super.init();
    this.addDisposable(
      traceSelection.onTraceSelectionChanged(() => {
        this.context.graphContainer.refreshGraph();
      })
    );
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.state.stackEnabled) {
      return true;
    }
    else {
      return false;
    }
  }

  updateRunNodes() {
    this._resubscribeOnData();
    this.removeAllRunNode();

    const trace = traceSelection.selected;
    if (trace) {
      const { applicationId, traceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      const rootIds = dp.util.getAsyncStackRootIds(traceId);

      // add new runNodes
      this.addRunNodeByRootIds(applicationId, rootIds);
    }
  }

  _resubscribeOnData() {
    // unsubscribe old
    this._unsubscribeOnNewData.forEach(f => f());
    this._unsubscribeOnNewData = [];

    // subscribe new
    if (traceSelection.selected) {
      const { applicationId } = traceSelection.selected;
      const dp = allApplications.getById(applicationId).dataProvider;
      const unsubscribes = [
        // [future-work]: only subscribe when stats are enabled
        dp.queryImpl.statsByContext.subscribe()
      ];

      // unsubscribe on refresh
      this._unsubscribeOnNewData.push(...unsubscribes);

      // also when node is disposed
      this.addDisposable(...unsubscribes);
    }
  }
}

export default AsyncStack;