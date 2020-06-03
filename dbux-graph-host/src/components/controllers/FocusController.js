import allApplications from 'dbux-data/src/applications/allApplications';
import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  get highlightManager() {
    return this.context.graphDocument.controllers.getComponent('HighlightManager');
  }

  init() {
    this.syncMode = true;
    traceSelection.onTraceSelectionChanged(this.handleTraceSelected);

    this.highlightManager.on('clear', () => {
      this.clearFocus();
      this.lastHighlighter = null;
    });

    // if already selected, show things right away
    setTimeout(() => {
      this.handleTraceSelected(traceSelection.selected);
    });
  }

  handleTraceSelected = (trace) => {
    if (trace?.contextId === this.state.focus?.contextId &&
      trace?.applicationId === this.state.focus?.applicationId) {
      this._selectedContextNode?.setSelected(true, trace.traceId);

      // nothing to do
      return;
    }

    if (!trace) this.clearFocus();
    else if (this.syncMode) {
      // only if in sync mode -> focus on the node
      const { contextId, applicationId } = trace;

      // WARNING: focus is async
      this.focus(applicationId, contextId);
    }

    // always decorate ContextNode
    this._selectContextNode(trace);
  }

  _selectContextNode(trace) {
    if (this._selectedContextNode) {
      // deselect old
      this._selectedContextNode.setSelected(false);
    }

    let contextNode;
    if (trace) {
      const { applicationId, contextId, traceId } = trace;
      contextNode = this.context.graphRoot.getContextNodeById(applicationId, contextId);
      if (contextNode) {
        // select new
        contextNode.setSelected(true, traceId);
      }
    }
    this._selectedContextNode = contextNode;
  }

  async focus(applicationId, contextId) {
    this.highlightManager.clear();
    this.highlightContext(applicationId, contextId);

    await this.revealContext(applicationId, contextId);

    // NOTE: this initiates an animation, and will finish after a little while
    this.setState({
      focus: { applicationId, contextId }
    });
  }

  async revealContext(applicationId, contextId) {
    const contextNode = this.owner.getContextNodeById(applicationId, contextId);
    // await contextNode.waitForInit();      // make sure, node has initialized

    // const graphNode = contextNode.controllers.getComponent('GraphNode');
    // await graphNode.reveal();   // make sure, node has revealed
    await contextNode.reveal(true);
  }

  highlightContext(applicationId, contextId) {
    const contextNode = this.owner.getContextNodeById(applicationId, contextId);
    this.lastHighlighter = contextNode.controllers.getComponent('Highlighter');
    this.lastHighlighter.inc();
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