// import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class SpreadElement extends BaseNode {
  static children = ['argument'];

  get traceCfg() {
    const [argNode] = this.getChildNodes();
    return argNode?.traceCfg;
  }

  buildDefaultTrace() {
    const [argNode] = this.getChildNodes();
    const traceData = argNode?.buildDefaultTrace(); // || this.createOwnDefaultTrace();

    if (traceData.path === argNode.path) {  // small sanity check
      // NOTE: we actually tace `argument`, but we want the "selectable trace" to be the entire `SpreadElement`
      traceData.path = this.path;
      traceData.meta = traceData.meta || {};
      traceData.meta.replacePath = argNode.path;
    }

    return traceData;
  }

  // createOwnDefaultTrace() {
  //   const [argPath] = this.getChildPaths();
  //   return {
  //     path: argPath,
  //     node: this,
  //     staticTraceData: {
  //       type: TraceType.ExpressionResult
  //     }
  //   };
  // }
}