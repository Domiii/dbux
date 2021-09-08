import GraphMode from '@dbux/graph-common/src/shared/GraphMode';
import SyncGraphBase from '../SyncGraphBase';

class SyncGraph extends SyncGraphBase {
  init() {
    super.init();

    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.state.graphMode === GraphMode.SyncGraph) {
      return true;
    }
    else {
      return false;
    }
  }

  handleTraceSelected = async (trace) => {
    await this.waitForRefresh();
    let contextNode;
    if (trace) {
      const { applicationId, contextId } = trace;
      contextNode = this.getContextNodeById(applicationId, contextId);
      if (this.context.graphDocument.state.followMode && contextNode) {
        // NOTE: since we do this right after init, need to check if contextNode have been built
        await contextNode.waitForInit();
        await this.focusController.focus(contextNode);
      }
    }
    this._selectContextNode(contextNode);
  }
}

export default SyncGraph;