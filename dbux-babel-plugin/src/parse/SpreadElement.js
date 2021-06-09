import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class SpreadElement extends BaseNode {
  static children = ['argument'];

  get traceCfg() {
    const [argNode] = this.getChildNodes();
    return argNode?.traceCfg;
  }

  createDefaultTrace() {
    const [argNode] = this.getChildNodes();
    return argNode?.createDefaultTrace?.() || this.createOwnDefaultTrace();
  }

  createOwnDefaultTrace() {
    const [argPath] = this.getChildPaths();
    return {
      path: argPath,
      node: this,
      staticTraceData: {
        type: TraceType.ExpressionResult
      }
    };
  }
}