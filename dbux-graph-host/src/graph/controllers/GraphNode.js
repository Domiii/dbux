import UserActionType from '@dbux/data/src/pathways/UserActionType';
import GraphNodeMode from '@dbux/graph-common/src/shared/GraphNodeMode';
import HostComponentEndpoint from '../../componentLib/HostComponentEndpoint';

const getNewChildrenCount = {
  [GraphNodeMode.Collapsed]: () => 0,
  [GraphNodeMode.ExpandChildren]: (node) => node.getChildrenCount(),
  [GraphNodeMode.ExpandSubgraph]: (node) => node.getSubGraphChildrenCount(),
};

export default class GraphNode extends HostComponentEndpoint {
  /**
   * Owner requirements:
   *  property `childrenBuilt`
   *  method `buildChildNodes`
   */
  init() {
    const parent = this.owner.parent?.controllers.getComponent(GraphNode);

    if (!this.state.mode) {
      if (parent) {
        this.state.mode = parent.getChildMode();
      }
      else {
        this.state.mode = GraphNodeMode.Collapsed;
      }
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

  setOwnMode(mode) {
    if (mode !== GraphNodeMode.Collapsed && this.owner.childrenBuilt === false) {
      this.owner.context.graphRoot.buildContextNodeChildren(this.owner);
    }

    this.setState({ mode });
  }

  /**
   * NOTE: setMode might takes a long time to expand ContextNodes. If setMode is called by user, we confirm before expand it.
   */
  async setModeUser(mode) {
    const newChildrenCount = getNewChildrenCount[mode](this.owner);
    const confirmMessage = `There are ${newChildrenCount} ContextNodes to expand and it might take a while. Are you sure?`;
    if (newChildrenCount > 10000 && !await this.componentManager.externals.confirm(confirmMessage, true)) {
      return;
    }
    this.setMode(mode);
  }

  setMode(mode) {
    if (this.state.mode === mode) {
      // nothing left to do
      return;
    }

    this.setOwnMode(mode);
    // GraphNodeMode.switchCall(mode, this.modeHandlers);

    // propagate mode to sub graph
    const childMode = this.getChildMode();
    for (const child of this.owner.children) {
      if (!hasGraphNode(child)) {
        this.logger.warn(`GraphNode owner's children contains no graphNode`);
      }
    }
    for (const child of this.owner.children.filter(hasGraphNode)) {
      child.controllers.getComponent(GraphNode).setMode(childMode);
    }
  }

  async reveal(expandItself = false) {
    const { parent } = this.owner;
    if (parent && hasGraphNode(parent)) {
      const parentGraphNode = parent.controllers.getComponent(GraphNode);
      await parentGraphNode.reveal(true);
    }
    if (expandItself && GraphNodeMode.is.Collapsed(this.state.mode)) {
      // expand children if collapsed
      this.setOwnMode(GraphNodeMode.ExpandChildren);
      await this.waitForUpdate();
    }
  }

  getPreviousMode() {
    let mode = GraphNodeMode.previousValue(this.state.mode);
    // if (mode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
    //   // skip "ExpandSubgraph" if there is only one level
    //   mode = GraphNodeMode.previousValue(mode);
    // }
    return mode;
  }

  getNextMode() {
    let mode = GraphNodeMode.nextValue(this.state.mode);
    // if (mode === GraphNodeMode.ExpandSubgraph && this.owner.children.computeMaxDepth() <= 1) {
    //   // skip "ExpandSubgraph" if there is only one level
    //   mode = GraphNodeMode.nextValue(mode);
    // }
    return mode;
  }

  public = {
    previousMode: () => {
      let mode = this.getPreviousMode();
      const { firstTrace: trace } = this.owner;
      const { context } = this.owner.state;
      this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphNodeCollapseChange, { mode, context, trace });
      this.setModeUser(mode);
    },
    nextMode: () => {
      let mode = this.getNextMode();
      const { firstTrace: trace } = this.owner;
      const { context } = this.owner.state;
      this.componentManager.externals.emitCallGraphAction(UserActionType.CallGraphNodeCollapseChange, { context, trace, mode });
      this.setModeUser(mode);
    },
    reveal: this.reveal
  }
}

function hasGraphNode(comp) {
  return !!comp.controllers.getComponent(GraphNode);
}