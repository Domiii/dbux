import NanoEvents from 'nanoevents';
import traceSelection from 'dbux-data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class FocusController extends HostComponentEndpoint {
  get highlightManager() {
    return this.context.graphDocument.controllers.getComponent('HighlightManager');
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  init() {
    this.syncMode = true;
    this._emitter = new NanoEvents();

    this.highlightManager.on('clear', () => {
      this.lastHighlighter = null;
    });

    this.hiddenNodeManager.onStateChanged(this.handleHiddenNodeChanged);

    const unbindSubscription = traceSelection.onTraceSelectionChanged(this.handleTraceSelected);
    this.addDisposable(unbindSubscription);
    // if already selected, show things right away
    this.handleTraceSelected(traceSelection.selected);
  }

  handleTraceSelected = async (trace) => {
    await this.waitForInit();
    
    let contextNode;
    if (trace) {
      const { applicationId, contextId } = trace;
      contextNode = this.owner.getContextNodeById(applicationId, contextId);
      if (this.syncMode) {
        this.focus(contextNode);
      }
    }
    else {
      this.clearFocus();
    }

    // always decorate ContextNode
    this._selectContextNode(contextNode);
  }

  handleHiddenNodeChanged = () => {
    this.handleTraceSelected(traceSelection.selected);
  }

  _selectContextNode(contextNode) {
    if (this._selectedContextNode && !this._selectedContextNode._isDisposed) {
      // deselect old
      this._selectedContextNode.setSelected(false);
    }

    if (contextNode) {
      // select new
      contextNode.setSelected(true);
    }

    this._selectedContextNode = contextNode;
  }

  toggleSyncMode() {
    const mode = !this.syncMode;
    this.setSyncMode(mode);
    return mode;
  }

  setSyncMode(mode) {
    if (this.syncMode === mode) {
      return;
    }
    this.syncMode = mode;
    if (this.syncMode) {
      this.handleTraceSelected(traceSelection.selected);
    }
    else {
      this.lastHighlighter?.dec();
      this.lastHighlighter = null;
    }
    this._emitter.emit('modeChanged', this.syncMode);
  }

  async focus(node) {
    // if node is hidden, we focus on the hiddenNode
    const hiddenNode = node.isHiddenBy();
    let targetNode = node;
    if (hiddenNode) {
      targetNode = hiddenNode;
    }

    await targetNode.reveal?.(true);
    this.highlight(targetNode);
    this.remote.slide(targetNode);
  }

  clearFocus() {
    if (this.lastHighlighter && !this.lastHighlighter._isDisposed) {
      this.lastHighlighter?.dec();
    }
    this.lastHighlighter = null;
    this.remote.slide(null);
  }

  highlight(node) {
    this.highlightManager.clear();
    // we clear all highlighter before highlight, so no need to dec lastHighlighter here
    // this.lastHighlighter.dec();
    this.lastHighlighter = node.controllers.getComponent('Highlighter');
    this.lastHighlighter.inc();
  }

  // ###########################################################################
  // own event
  // ###########################################################################
  
  on(evtName, cb) {
    this._emitter.on(evtName, cb);
  }
}