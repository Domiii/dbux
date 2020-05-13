import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  init() {
    this.syncMode = true;
    traceSelection.onTraceSelectionChanged(this.onTraceSelected);
  }

  onTraceSelected = (trace) => {
    if (!trace) this.clearFocus();
    else if (this.syncMode) {
      this.focusTrace(trace);
    }
  }

  focus(applicationId, contextId) {
    this.revealContext(applicationId, contextId);
    this.setState({
      focus: { applicationId, contextId }
    });
  }

  focusTrace(trace) {
    if (!trace) return;
    const { contextId, applicationId } = trace;
    this.focus(applicationId, contextId);
  }

  revealContext(applicationId, contextId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    const contextNode = this.owner.getContextNodeByContext(context);
    contextNode.controllers.getComponent('GraphNode').reveal();
  }

  clearFocus() {
    this.setState({
      focus: null
    });
  }

  toggleSyncMode() {
    this.syncMode = !this.syncMode;
    if (this.syncMode) {
      this.focusTrace(traceSelection.selected);
    }
    return this.syncMode;
  }

  public = {
    notifyFocused: this.clearFocus
  }
}