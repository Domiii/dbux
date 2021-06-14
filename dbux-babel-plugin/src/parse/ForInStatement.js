import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class ForInStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Loop'
  ];

  exit() {
    const [left, right] = this.getChildPaths();

    // TODO: wrap iterator to create one `DataNode` per iteration
    //      if `var`, only declare once, then assign to var from iterator
    //      else, re-declare from iterator
    // TODO: left can be {Array,Object,Assignment}Pattern

    const moreTraceData = {
      staticTraceData: {
        type: TraceType.Declaration,
        dataNode: {
          isNew: false
        }
      }
    };
    left.addOwnDeclarationTrace(null, moreTraceData);
  }
}
