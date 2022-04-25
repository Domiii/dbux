import TraceType from '@dbux/common/src/types/constants/TraceType';
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

    // const [/* lvalNode */, valueNode] = node.getChildNodes();
    const [/* lvalPath */, valuePath] = node.getChildPaths();

    if (!valuePath) {
      this.error(`missing RVal node in "${this.node}"`);
      return;
    }

    if (!valuePath.node) {
      // no write?
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
    Traces.addTraceWithInputs(traceData, [valuePath]);
  }
}