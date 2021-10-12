import { newLogger } from '@dbux/common/src/log/logger';
import traceSelection from '@dbux/data/src/traceSelection';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError, trace: logTrace } = newLogger('FocusController');

/** @typedef {import('../ContextNode').default} ContextNode */

export default class FocusController extends HostComponentEndpoint {
  init() {
    this.addDisposable(
      this.context.graphDocument.onGraphModeChanged(this.handleTraceSelected),
      this.context.graphDocument.onFollowModeChanged(this.handleTraceSelected),
      traceSelection.onTraceSelectionChanged(this.handleTraceSelected),
    );
  }

  get followMode() {
    return this.context.graphDocument.state.followMode;
  }

  handleTraceSelected = async () => {
    if (!this.context.graphContainer.isEnabled()) {
      return;
    }

    await this.waitForInit();
    const trace = traceSelection.selected;
    try {
      await this.owner.graph.handleTraceSelected?.(trace);
    }
    catch (err) {
      logTrace(`GraphBase.handleTraceSelected failed, selected trace #${trace?.traceId}`, err);
    }
  }

  /**
   * @param {ContextNode} node 
   */
  async focus(node) {
    // if node is hidden, focus on the hiddenNode instead
    let targetNode = node;
    const hiddenNode = node.hiddenByNode?.();
    if (hiddenNode) {
      targetNode = hiddenNode;
    }

    await targetNode.reveal?.(true);
    this.remote.slideToNode(targetNode);
  }

  clearFocus() {
    this.remote.slideToNode(null);
  }
}