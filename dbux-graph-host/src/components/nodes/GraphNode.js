import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class GraphNode extends HostComponentEndpoint {
  init() {
    this.state.mode = GraphNodeMode.Collapsed;
  }

  setMode(mode) {
    this.setState({ mode });
    GraphNodeMode.switchCall(mode, this.modeHandlers);
  }

  modeHandlers = {
    Collapsed: () => {
      // collapse sub graph
      for (const child of this.owner.children.filter(hasGraphNode)) {
        child.graphNode.setMode(GraphNodeMode.Collapsed);
      }
    },
    ExpandChildren: () => {
      // collapse sub graph
      for (const child of this.owner.children.filter(hasGraphNode)) {
        child.graphNode.setMode(GraphNodeMode.Collapsed);
      }
    },
    ExpandSubgraph: () => {
      // expand sub graph
      for (const child of this.owner.children.filter(hasGraphNode)) {
        child.graphNode.setMode(GraphNodeMode.ExpandSubgraph);
      }
    }
  }

  public = {
    setMode: this.setMode,
    nextMode: () => {
      const mode = GraphNodeMode.nextValue(this.state.mode);
      this.setMode(mode);
    }
  }
}

function hasGraphNode(comp) {
  return !!comp.graphNode;
}