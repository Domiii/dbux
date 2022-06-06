import TraceType from '@dbux/common/src/types/constants/TraceType';
import { buildArrayExpression } from '../instrumentation/builders/arrays';
import { ZeroInputTrace } from '../instrumentation/builders/buildUtil';
import BaseNode from './BaseNode';
import { makeSpreadableArgumentArrayCfg } from '../helpers/argsUtil';

/**
 * 
 */
export default class ArrayExpression extends BaseNode {
  static children = ['elements'];

  exit() {
    const { path } = this;
    const [elementPaths] = this.getChildPaths();
    const [elementNodes] = this.getChildNodes();

    const traceData = {
      path,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult,
        dataNode: {
          isNew: true
        },
        data: {
          argConfigs: makeSpreadableArgumentArrayCfg(elementPaths)
        }
      },
      meta: {
        build: buildArrayExpression
      }
    };

    /**
     * NOTE: arrays can contain empty elements, e.g.: `[,2,3,4,,5,,,6]`
     * Based on Traces#addDefaultTraces.
     */
    const inputs = elementNodes.map(el => {
      const elTraceCfg = el?.addDefaultTrace();
      return elTraceCfg || ZeroInputTrace;
    });
    this.Traces.addTraceWithInputTraceCfgs(traceData, inputs);
  }
}
