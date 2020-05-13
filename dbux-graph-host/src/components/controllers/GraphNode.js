import GraphNodeMode from 'dbux-graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

export default class GraphNode extends HostComponentEndpoint {
  init() {
    const parent = this.owner.parent?.controllers.getComponent(GraphNode);
    if (parent) {
      this.state.mode = parent.getChildMode();
    }
    else {
      this.state.mode = GraphNodeMode.Collapsed;
    }
  }

  getChildMode() {
    const { mode } = this.state;
    switch (mode) {
      case GraphNodeMode.ExpandSubgraph:
        return GraphNodeMode.ExpandSubgraph;
      case GraphNodeMode.ExpandChildren:
      case GraphNodeMode.Collapsed:
      default:
        return GraphNodeMode.Collapsed;
    }
  }

  setMode(mode) {
    this.setState({ mode });
    // GraphNodeMode.switchCall(mode, this.modeHandlers);

    // propagate mode to sub graph
    const childMode = this.getChildMode();
    for (const child of this.owner.children.filter(hasGraphNode)) {
      child.controllers.getComponent(GraphNode).setMode(childMode);
    }
  }

  reveal() {
    let currentNode = this.owner.parent;
    let graphNode;
    while (currentNode && hasGraphNode(currentNode)) {
      graphNode = currentNode.controllers.getComponent(GraphNode);
      if (graphNode.state.mode === GraphNodeMode.Collapsed) {
        // Expand children if parent mode is collapsed
        graphNode.setMode(GraphNodeMode.ExpandChildren);
      }
      currentNode = currentNode.parent;
    }
  }

  public = {
    setMode: this.setMode,
    nextMode: () => {
      let mode = GraphNodeMode.nextValue(this.state.mode);
      if (mode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
        // skip "ExpandSubgraph" if there is only one level
        mode = GraphNodeMode.nextValue(mode);
      }
      this.setMode(mode);
    },
    reveal: this.reveal
  }
}

function hasGraphNode(comp) {
  return !!comp.controllers.getComponent(GraphNode);
}