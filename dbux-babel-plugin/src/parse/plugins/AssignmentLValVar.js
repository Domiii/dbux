import TraceType from '@dbux/common/src/types/constants/TraceType';
import SyntaxType from '@dbux/common/src/types/constants/SyntaxType';
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

    // console.error('assignment', !!node.isNewValue, node.isNewValue?.(), node.debugTag);

    const traceData = {
      staticTraceData: {
        type: TraceType.WriteVar,
        syntax: SyntaxType.AssignmentLValVar,
        dataNode: {
          isNew: node.isNewValue?.() || false
        }
      },
      meta: {
        // instrument: Traces.instrumentTraceWrite
        build: buildTraceWriteVar
      }
    };

    node.decorateWriteTraceData(traceData);
    
    // NOTE: `declarationTid` comes from `node.getDeclarationNode`
    Traces.addTraceWithInputs(traceData, [valuePath]);
  }
}