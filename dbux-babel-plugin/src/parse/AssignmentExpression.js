import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class AssignmentExpression extends BaseNode {
  static children = ['left', 'right'];
  static plugins = [];

  exit() {
    const { path, Traces } = this;

    const [leftNode, rightNode] = this.getChildNodes();

    // TODO: WriteME

    const writeTraceCfg = {
      path,
      node: this,
      varNode: leftNode,
      staticTraceData: {
        type: TraceType.WriteVar,
        dataNode: {
          isNew: false
        }
      },
      meta: {
        instrument: Traces.instrumentTraceWrite
      }
    };

    Traces.addTraceWithInputs(writeTraceCfg, [rightNode.path] || EmptyArray);

    // traces.addTraceWithInputs({ path: initPath, node: initNode, varNode: idNode, staticTraceData}, [initPath]);
  }
}