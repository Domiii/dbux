import TraceType from '@dbux/common/src/core/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import { buildTraceWrite } from '../../instrumentation/builders/trace';
import ParsePlugin from '../../parseLib/ParsePlugin';

export default class LValIdentifier extends ParsePlugin {
  exit() {
    const { node } = this;
    const { path, Traces } = node;

    const [, rightNode] = node.getChildNodes();

    const writeTraceCfg = {
      path,
      node,
      staticTraceData: {
        type: TraceType.WriteVar
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWrite
      }
    };

    Traces.addTraceWithInputs(writeTraceCfg, [rightNode.path] || EmptyArray);
  }
}