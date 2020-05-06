import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  init() {
    traceSelection.onTraceSelectionChanged(this.onTraceSelected);
  }

  onTraceSelected(trace) {
    const { contextId, applicationId } = trace;
    this.focus(applicationId, contextId);
  }

  focus(applicationId, contextId) {
    this.setState({
      focus: { applicationId, contextId }
    });
  }

  clearFocus() {
    this.setState({
      focus: {}
    });
  }

  public = {
    notifyFocused: this.clearFocus
  }
}