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

    // if already selected, show things right away
    setTimeout(() => {
      this.handleTraceSelected(traceSelection.selected);
    }, 500);
  }

  handleTraceSelected = (trace) => {
    if (trace?.contextId === this.state.focus?.contextId &&
      trace?.applicationId === this.state.focus?.applicationId) {
      // nothing to do
      return;
    }
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

  async revealContext(applicationId, contextId) {
    const contextNode = this.getContextNode(applicationId, contextId);
    await contextNode.waitForInit();
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
      this.handleTraceSelected(traceSelection.selected);
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