import GroupNode from './GroupNode';

/**
 * 
 */
export default class HoleNode extends GroupNode {
  init() {
    // TODO: make this a proper "Hole"/"Group" representation → not just a single context!
    this.super.init();

    this.state.contextLabel = `HOLE (${this.state.hole.contexts.length})`;
    this.state.callerTracelabel = '';
    this.state.valueLabel = '';
    this.state.moduleName = '';
  }

  /**
   * @virtual
   * @return {ExecutionContext[]}
   */
  getAllChildContexts() {
    const { frontier } = this.state.hole;
    return frontier;
  }
}
