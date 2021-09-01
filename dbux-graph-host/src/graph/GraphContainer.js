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

  shared() {
    return {
      context: {
        graphContainer: this,
        graphRoot: this.graph,
      }
    };
  }
}

export default GraphContainer;