import { getGraphClassByType } from '@dbux/graph-common/src/shared/GraphType';
import HostComponentEndpoint from '../componentLib/HostComponentEndpoint';

class GraphContainer extends HostComponentEndpoint {
  init() {
    if (!('enabled' in this.state)) {
      this.state.enabled = true;
    }

    // provide controllers to graph
    this.controllers.createComponent('HighlightManager');
    this.controllers.createComponent('ZoomBar');

    // make graph
    const GraphClass = getGraphClassByType(this.state.graphType);
    this.graph = this.children.createComponent(GraphClass);
  }

  refreshGraph() {
    if (this.graph.shouldBeEnabled()) {
      this.setState({ enabled: true });
      this.graph.refresh();
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