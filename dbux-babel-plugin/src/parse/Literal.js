import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class Literal extends BaseNode {
  buildDefaultTrace() {
    const { path } = this;

    return {
      node: this,
      path,
      staticTraceData: {
        type: TraceType.Literal,
        dataNode: {
          isNew: true
        }
      }
    };
  }
}
