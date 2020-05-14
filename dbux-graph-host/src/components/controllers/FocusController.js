import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  init() {
    this.highlightManager = this.context.graphDocument.controllers.getComponent('HighlightManager');
    this.syncMode = true;
    traceSelection.onTraceSelectionChanged(this.handleTraceSelected);


    this.highlightManager.on('clear', () => {
      this.clearFocus();
      this.lastHighlighter = null;
    });
  }

  handleTraceSelected = (trace) => {
    if (!trace) this.clearFocus();
    else if (this.syncMode) {
      const { contextId, applicationId } = trace;
      this.focus(applicationId, contextId);
    }
  }

  focus(applicationId, contextId) {
    this.highlightManager.clear();
    this.highlightContext(applicationId, contextId);
    this.revealContext(applicationId, contextId);

    this.setState({
      focus: { applicationId, contextId }
    });
  }

  revealContext(applicationId, contextId) {
    const contextNode = this.getContextNode(applicationId, contextId);
    contextNode.controllers.getComponent('GraphNode').reveal();
  }

  highlightContext(applicationId, contextId) {
    const contextNode = this.getContextNode(applicationId, contextId);
    this.lastHighlighter = contextNode.controllers.getComponent('Highlighter');
    this.lastHighlighter.inc();
  }

  getContextNode(applicationId, contextId) {
    const dp = allApplications.getById(applicationId).dataProvider;
    const context = dp.collections.executionContexts.getById(contextId);
    const contextNode = this.owner.getContextNodeByContext(context);
    return contextNode;
  }

  clearFocus = () => {
    if (this.state.focus) {
      this.setState({
        focus: null
      });
    }
  }

  toggleSyncMode() {
    this.syncMode = !this.syncMode;
    if (this.syncMode) {
      const { contextId, applicationId } = traceSelection.selected;
      this.focus(applicationId, contextId);
    }
    else {
      if (this.lastHighlighter) {
        this.lastHighlighter.dec();
        this.lastHighlighter = null;
      }
      this.clearFocus();
    }
    return this.syncMode;
  }

  public = {
    notifyFocused: this.clearFocus
  }
}