// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class SpreadElement extends BaseNode {
  static children = ['argument'];

  get traceCfg() {
    const [argNode] = this.getChildNodes();
    return argNode?.traceCfg;
  }

  addDefaultTrace() {
    const [argNode] = this.getChildNodes();
    const traceData = argNode?.addDefaultTrace(); // || this.createOwnDefaultTrace();

    if (traceData?.path === argNode.path) {  // small sanity check
      // hackfix the argument trace
      // NOTE: we actually tace `argument`, but we want the "selectable trace" to be the entire `SpreadElement`
      // traceData.path = this.path;
      traceData.meta = traceData.meta || {};
      traceData.meta.targetPath = argNode.path;
      traceData.dataNode ||= {};
      traceData.dataNode.label = '...';
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