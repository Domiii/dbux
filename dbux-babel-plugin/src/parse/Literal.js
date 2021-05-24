import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class Literal extends BaseNode {
  createInputTrace() {
    const { path } = this;

    return {
      node: this,
      path,
      staticTraceData: {
        type: TraceType.ExpressionValue,
        dataNode: {
          // TODO: `isNew` for literals is only `true` the first time. Need dynamic `isNew` to mirror this.
          isNew: true
        }
      }
    };
  }
}
