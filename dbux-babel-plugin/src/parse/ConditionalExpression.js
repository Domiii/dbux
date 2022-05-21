import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class ConditionalExpression extends BaseNode {
  static children = ['test', 'consequent', 'alternate'];

  // TODO: this actually passes on one of the input values
  // TODO: when fixing this, apply same fix to LogicalExpression

  exit() {
    const { path } = this;
    const [, result1, result2] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.BranchExpression,
        dataNode: {
          isNew: false,
          label: '?:'
        }
      }
    };
    this.Traces.addTraceWithInputs(traceData, [result1, result2]);
  }
}