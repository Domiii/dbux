import TraceType from '@dbux/common/src/types/constants/TraceType';
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

    // NOTE: arrays can contain empty elements, e.g.: `[,2,3,4,,5,,,6]`
    const inputs = elements.filter(el => el.node);

    this.Traces.addTraceWithInputs(traceData, inputs);
  }
}
