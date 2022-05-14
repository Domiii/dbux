import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

/**
 * E.g.: someTag`some ${quasi} here`
 */
export default class TaggedTemplateExpression extends BaseNode {
  static children = ['tag', 'quasi'];

  exit() {
    // → handled in `TemplateLiteral`
    
    // const { path } = this;
    // const [, expressions] = this.getChildPaths();

    // const traceData = {
    //   path,
    //   node: this,
    //   staticTraceData: {
    //     type: TraceType.ExpressionResult,
    //     dataNode: {
    //       isNew: true,
    //       label: TODO
    //     }
    //   }
    // };

    // const inputs = expressions;
    // this.Traces.addTraceWithInputs(traceData, inputs);
  }
}