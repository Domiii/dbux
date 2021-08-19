import NanoEvents from 'nanoevents';
import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('FocusController');

/** @typedef {import('../ContextNode').default} ContextNode */
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
    // TODO: move `followMode` to `state.followMode`
    this.followMode = true;
    this._emitter = new NanoEvents();

    this.highlightManager.on('clear', () => {
      this.lastHighlighter = null;
    });

    this.hiddenNodeManager.onStateChanged(this.handleHiddenNodeChanged);
    this.context.graphDocument.onAsyncGraphModeChanged(this.handleTraceSelected);

    const unbindSubscription = traceSelection.onTraceSelectionChanged(this.handleTraceSelected);
    this.addDisposable(unbindSubscription);
    // if already selected, show things right away
    this.handleTraceSelected();
  }

  /**
   * @returns {Promise<ContextNode>}
   */
  async getContextNodeById(applicationId, contextId) {
    return this.owner.getContextNodeById(applicationId, contextId);
  }

  handleTraceSelected = async (ignoreFailed = false) => {
    const trace = traceSelection.selected;
    try {
      await this.waitForInit();
      if (this.context.graphDocument.asyncGraphMode) {
        // goto async node of trace
        let asyncNode;
        if (trace) {
          const { applicationId } = trace;
          const dp = allApplications.getById(applicationId).dataProvider;
          const { rootContextId } = trace;
          asyncNode = dp.indexes.asyncNodes.byRoot.getFirst(rootContextId);
          if (this.followMode && asyncNode) {
            await this.waitForAsyncGraph();
            await this.remote.focusAsyncNode(asyncNode, ignoreFailed);
          }
        }
        else {
          this.clearFocus();
        }

        if (asyncNode) {
          await this.waitForAsyncGraph();
          await this.remote.selectAsyncNode(asyncNode, ignoreFailed);
        }
        else {
          await this.remote.selectAsyncNode(null);
        }
      }
      else {
        let contextNode;
        if (trace) {
          const { applicationId, contextId } = trace;
          contextNode = await this.getContextNodeById(applicationId, contextId);
          if (this.followMode && contextNode) {
            // NOTE: since we do this right after init, need to check if contextNode have been built
            await this.focus(contextNode);
          }
        }

        // always decorate ContextNode
        this._selectContextNode(contextNode);
      }
    }
    catch (err) {
      logTrace(`Cannot focus on selected trace #${trace?.traceId}`, trace, err);
    }
  }

  handleHiddenNodeChanged = () => {
    this.handleTraceSelected();
  }

  _selectContextNode(contextNode) {
    if (this._selectedContextNode && !this._selectedContextNode.isDisposed) {
      // deselect old
      this._selectedContextNode.setSelected(false);
    }

    if (contextNode) {
      // select new
      contextNode.setSelected(true);
    }

    this._selectedContextNode = contextNode;
  }

  toggleFollowMode() {
    const mode = !this.followMode;
    this.setFollowMode(mode);
    return mode;
  }

  setFollowMode(mode) {
    if (this.followMode === mode) {
      return;
    }
    this.followMode = mode;
    if (this.followMode) {
      this.handleTraceSelected();
    }
    else {
      // this.lastHighlighter?.dec();
      // this.lastHighlighter = null;
    }
    this._emitter.emit('modeChanged', this.followMode);
  }

  /**
   * @param {ContextNode} node 
   */
  async focus(node) {
    // if node is hidden, we focus on the hiddenNode
    const hiddenNode = node.isHiddenBy();
    let targetNode = node;
    if (hiddenNode) {
      targetNode = hiddenNode;
    }

    await targetNode.reveal?.(true);
    // this.highlight(targetNode);
    this.remote.slideToNode(targetNode);
  }

  clearFocus() {
    // if (this.lastHighlighter && !this.lastHighlighter._isDisposed) {
    //   this.lastHighlighter?.dec();
    // }
    // this.lastHighlighter = null;
    this.remote.slideToNode(null);
  }

  // highlight(node) {
  //   this.highlightManager.clear();
  //   this.lastHighlighter = node.controllers.getComponent('Highlighter');
  //   this.lastHighlighter.inc();
  // }

  async waitForAsyncGraph() {
    const { asyncGraph } = this.context.graphDocument;
    await asyncGraph.waitForRefresh();
    await asyncGraph.waitForUpdate();
  }

  // ###########################################################################
  // own event
  // ###########################################################################

  on(evtName, cb) {
    this._emitter.on(evtName, cb);
  }
}