import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceDeleteME } from '../../instrumentation/builders/misc';
import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class Delete extends BasePlugin {
  exit1() {
    // make sure, `ME` itself is NOT traced
    const { node } = this;
    const [meNode] = node.getChildNodes();
    meNode.handler = this;
  }

  exit() {
    const { node } = this;
    const { path, Traces } = node;

    const [meNode] = node.getChildNodes();
    const [objectNode] = meNode.getChildNodes();

    // make sure, `object` is traced
    objectNode.addDefaultTrace();

    const objectTid = objectNode.traceCfg?.tidIdentifier;
    if (!objectTid) {
      this.warn(`objectNode did not have traceCfg.tidIdentifier in ${objectNode}`);
    }

    const objectAstNode = path.scope.generateDeclaredUidIdentifier('o');
    const propertyAstNode = path.scope.generateDeclaredUidIdentifier('p');

    // add delete trace
    const traceData = {
      path,
      node,
      staticTraceData: {
        type: TraceType.WriteME
      },
      data: {
        objectTid,
        objectAstNode,
        propertyAstNode
      },
      meta: {
        build: buildTraceDeleteME
      }
    };

    Traces.addTrace(traceData);
  }
}