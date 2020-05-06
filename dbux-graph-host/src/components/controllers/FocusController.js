import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  init() {
    traceSelection.onTraceSelectionChanged(this.onTraceSelected);
  }

  onTraceSelected = (trace) => {
    const { traceId, contextId, applicationId } = trace;
    this.setState({
      focus: { traceId, contextId, applicationId }
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