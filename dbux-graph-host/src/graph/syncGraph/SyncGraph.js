import GraphMode from '@dbux/graph-common/src/shared/GraphMode';
import SyncGraphBase from '../SyncGraphBase';

class SyncGraph extends SyncGraphBase {
  init() {
    super.init();
    
    this.controllers.createComponent('HiddenNodeManager');
    this.children.createComponent('HiddenBeforeNode');
    this.children.createComponent('HiddenAfterNode');

    this.refresh();
  }

  shouldBeEnabled() {
    if (this.context.graphDocument.state.graphMode === GraphMode.SyncGraph) {
      return true;
    }
    else {
      return false;
    }
  }
}

export default SyncGraph;