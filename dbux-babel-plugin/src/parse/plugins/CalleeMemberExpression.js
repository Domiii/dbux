import { traceCallExpressionME } from '../../instrumentation/callExpressions';
import ParsePlugin from '../../parseLib/ParsePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class CalleeMemberExpression extends ParsePlugin {
  /**
   * @type {MemberExpression}
   */
  get calleeNode() {
    const [calleeNode] = this.node.getChildNodes();
    return calleeNode;
  }

  get instrumentCallExpression() {
    return traceCallExpressionME;
  }

  exit1() {
    const { calleeNode } = this;

    // NOTE: `calleeNode instanceof MemberExpression`
    calleeNode.handler = this;
  }

  handleCallTrace(trace) {
    const {
      calleeNode,
      node,
      node: { path: { scope } }
    } = this;

    const objectVar = scope.generateDeclaredUidIdentifier('o');
    const [, propertyPath] = node.getChildPaths();

    trace.data.objectVar = objectVar;

    // TODO: need more changes to ME.addRValTrace
    //  1. need to add a new assignment trace, not replace the original
    //  2. input should point to original object, not objectVar
    trace.data.calleeTrace = calleeNode.wrapRVal(objectVar, propertyPath.node, false);
  }
}