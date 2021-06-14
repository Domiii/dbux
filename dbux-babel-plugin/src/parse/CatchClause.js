// import TraceType from '@dbux/common/src/core/constants/TraceType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class CatchClause extends BaseNode {
  static children = ['param'];

  exit() {
    const [paramNode] = this.getChildNodes();

    if (paramNode) {
      // e.g. `catch (err) { ... }`
      // NOTE: very similar to `Function._addParamTrace` (without default value)
      const moreTraceData = {
        staticTraceData: {
          type: TraceType.Param
        }
      };
      paramNode.addOwnDeclarationTrace(paramNode.path, moreTraceData);
    }
    else {
      // e.g. `catch { ... }`
    }
  }
}