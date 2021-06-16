import TraceType from '@dbux/common/src/core/constants/TraceType';
import { LValHolderNode } from '../_types'; 
import { buildTraceWriteVar } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';

export default class AssignmentLValVar extends BasePlugin {
  /**
   * @type {LValHolderNode}
   */
  node;

  exit() {
    const {
      node
    } = this;
    const { Traces } = node;

    const valueNode = node.getRValNode();

    if (!valueNode) {
      this.warn(`AssignmentLValVar did not have an RVal node: ${this.node.path}`);
      return;
    }

    if (!valueNode.path.node) {
      // no write
      return;
    }

    const traceData = {
      staticTraceData: {
        type: TraceType.WriteVar
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteVar
      }
    };

    this.node.decorateWriteTraceData(traceData);
    
    // NOTE: `declarationTid` comes from `node.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [valueNode.path]);
  }
}