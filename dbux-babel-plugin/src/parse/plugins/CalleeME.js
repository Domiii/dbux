import { traceCallExpressionME } from '../../instrumentation/callExpressions';
import BasePlugin from './BasePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class CalleeME extends BasePlugin {
  /**
   * @return {MemberExpression}
   */
  get calleeNode() {
    return this.node.calleeNode;
  }

  get instrumentCallExpression() {
    return traceCallExpressionME;
  }

  exit1() {
    const { calleeNode } = this;
    calleeNode.handler = this;
  }

  decorateCallTrace(traceCfg) {
    const {
      calleeNode,
      // node,
      node: { Traces }
    } = this;

    // const [objectPath/* , propertyPath */] = calleeNode.getChildPaths();

    // NOTE: o.#x is valid, if inside of o's class
    const objectVar = Traces.generateDeclaredUidIdentifier('o');

    // NOTE: for the final CallExpression, the callee is chopped into pieces -
    //  1. store object (`o`) in both, callee node (as `objectAstNode`) and call node (as `objectVar`)
    //  2. store calleeAstNode in callee trace (`o[prop]`)
    traceCfg.data.objectVar = objectVar;

    // NOTE:
    //  1. instrument (replace) the new calleeAstNode, not the original
    //  2. input should point to original object
    traceCfg.data.calleeTrace = calleeNode.addRValTrace(false, objectVar);
  }
}