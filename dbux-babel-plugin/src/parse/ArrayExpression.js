import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildArrayExpression } from '../instrumentation/builders/arrays';
import BaseNode from './BaseNode';
import { makeSpreadableArgumentArrayCfg } from '../helpers/argsUtil';

/**
 * 
 */
export default class ArrayExpression extends BaseNode {
  static children = ['elements'];

  exit() {
    const { path } = this;
    const [elements] = this.getChildPaths();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        },
        data: {
          argConfigs: makeSpreadableArgumentArrayCfg(elements)
        }
      },
      meta: {
        build: buildArrayExpression
      }
    };
    
    const inputs = elements;

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}
