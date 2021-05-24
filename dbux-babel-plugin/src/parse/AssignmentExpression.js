import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildTraceWrite } from '../instrumentation/builders/trace';
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
      staticTraceData: {
        type: TraceType.WriteVar
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWrite
      }
    };

    Traces.addTraceWithInputs(writeTraceCfg, [rightNode.path] || EmptyArray);

    // traces.addTraceWithInputs({ path: initPath, node: initNode, staticTraceData}, [initPath]);
  }
}