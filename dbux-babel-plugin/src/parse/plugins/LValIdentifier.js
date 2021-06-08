import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceWrite } from '../../instrumentation/builders/misc';
import ParsePlugin from '../../parseLib/ParsePlugin';

export default class LValIdentifier extends ParsePlugin {
  exit() {
    const { node } = this;
    const { Traces } = node;

    const [, rightNode] = node.getChildNodes();

    if (!rightNode.path.node) {
      // no write
      return;
    }

    const traceData = {
      staticTraceData: {
        type: TraceType.WriteVar
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWrite
      }
    };

    this.node.decorateWriteTraceData(traceData);
    
    // NOTE: `declarationTid` comes from `AssignmentExpression.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [rightNode.path]);
  }
}