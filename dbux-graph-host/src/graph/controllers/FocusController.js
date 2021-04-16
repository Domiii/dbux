import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import sleep from '@dbux/common/src/util/sleep';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('FocusController');

/** @typedef {import('./Highlighter').default} Highlighter */

export default class FocusController extends HostComponentEndpoint {
  /**
   * @type {Highlighter}
   */
  lastHighlighter;

  get highlightManager() {
    return this.context.graphDocument.controllers.getComponent('HighlightManager');
  }

  get hiddenNodeManager() {
    return this.context.graphRoot.controllers.getComponent('HiddenNodeManager');
  }

  init() {
    // NOTE: sync mode is on by default
    // TODO: move `syncMode` to `state.syncMode`
    this.syncMode = true;
    this._emitter = new NanoEvents();

    this.highlightManager.on('clear', () => {
      this.lastHighlighter = null;
    });

    this.hiddenNodeManager.onStateChanged(this.handleHiddenNodeChanged);

    const unbindSubscription = traceSelection.onTraceSelectionChanged(this.handleTraceSelected);
    this.addDisposable(unbindSubscription);
    // if already selected, show things right away
    this.handleTraceSelected();
  }

  handleTraceSelected = async () => {
    try {
      const trace = traceSelection.selected;
      await this.waitForInit();
      
      let contextNode;
      if (trace) {
        const { applicationId, contextId } = trace;
        contextNode = await this.owner.getContextNodeById(applicationId, contextId);
        if (this.syncMode && contextNode) {
          // NOTE: since we do this right after init, need to check if contextNode have been built
          await this.focus(contextNode);
        }
      }
      else {
        this.clearFocus();
      }
  
      // always decorate ContextNode
      this._selectContextNode(contextNode);
    }
    catch (err) {
      logError('Cannot focus on selected trace', err);
    }
  }

  handleHiddenNodeChanged = () => {
    this.handleTraceSelected();
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
      this.handleTraceSelected();
    }
    else {
      // this.lastHighlighter?.dec();
      // this.lastHighlighter = null;
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
    // this.highlight(targetNode);
    this.remote.slide(targetNode);
  }

  clearFocus() {
    // if (this.lastHighlighter && !this.lastHighlighter._isDisposed) {
    //   this.lastHighlighter?.dec();
    // }
    // this.lastHighlighter = null;
    this.remote.slide(null);
  }

  // highlight(node) {
  //   this.highlightManager.clear();
  //   this.lastHighlighter = node.controllers.getComponent('Highlighter');
  //   this.lastHighlighter.inc();
  // }

  // ###########################################################################
  // own event
  // ###########################################################################
  
  on(evtName, cb) {
    this._emitter.on(evtName, cb);
  }
}