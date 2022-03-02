import { getGraphClassByType } from '@dbux/graph-common/src/shared/GraphType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

/** @typedef {import('./SyncGraphBase').default} SyncGraphBase */

class GraphContainer extends HostComponentEndpoint {
  /**
   * @type {SyncGraphBase}
   */
  graph;

  init() {
    // provide controllers to graph
    this.controllers.createComponent('HighlightManager');
    this.focusController = this.controllers.createComponent('FocusController');
    this.controllers.createComponent('ZoomBar');
    
    // make graph
    const GraphClass = getGraphClassByType(this.state.graphType);
    this.graph = this.children.createComponent(GraphClass);
  }

  isEnabled() {
    return this.state.enabled;
  }

  refreshGraphRoots() {
    if (this.graph.shouldBeEnabled()) {
      this.setState({ enabled: true });
      this.graph.refresh();
      this.focusController.handleTraceSelected();
    }
    else {
      this.setState({ enabled: false });
      this.graph.clear();
    }
  }

  shared() {
    return {
      context: {
        graphContainer: this,
      }
    };
  }
}

export default GraphContainer;