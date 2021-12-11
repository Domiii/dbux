import EmptyArray from '@dbux/common/src/util/EmptyArray';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection/index';
import StackMode from '@dbux/graph-common/src/shared/StackMode';
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
    if (this.context.graphDocument.state.stackMode !== StackMode.Hidden) {
      return true;
    }
    else {
      return false;
    }
  }

  updateContextNodes() {
    let contexts = EmptyArray;

    const trace = traceSelection.selected;
    if (trace) {
      const { applicationId, traceId } = trace;
      const dp = allApplications.getById(applicationId).dataProvider;
      contexts = dp.util.getAsyncStackContexts(traceId);
    }

    this.updateByContexts(contexts);
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