import TraceType from '@dbux/common/src/types/constants/TraceType';
import last from 'lodash/last';
import BaseNode from './BaseNode';

export default class SequenceExpression extends BaseNode {
  static children = ['expressions'];

  exit() {
    const { path } = this;
    const [expressions] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult
      },
      dataNode: {
        label: ','
      }
    };

    // add trace for all children
    expressions.forEach(this.Traces.addDefaultTrace);

    // add only last child as actual input
    // NOTE: `assert(1,2,3 === 3)`
    const inputs = [];
    expressions.length && inputs.push(last(expressions));

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}