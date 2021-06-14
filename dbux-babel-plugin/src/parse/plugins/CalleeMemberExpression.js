import * as t from '@babel/types';
import { traceCallExpressionME } from '../../instrumentation/callExpressions';
import ParsePlugin from '../../parseLib/ParsePlugin';

/** @typedef { import("../MemberExpression").default } MemberExpression */

/**
 * 
 */
export default class CalleeMemberExpression extends ParsePlugin {
  /**
   * @return {MemberExpression}
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
    calleeNode.handler = this;
  }

  decorateCallTrace(traceCfg) {
    const {
      calleeNode,
      // node,
      node: { path: { scope } }
    } = this;

    // const [objectPath/* , propertyPath */] = calleeNode.getChildPaths();

    const objectVar = scope.generateDeclaredUidIdentifier('o');

    // NOTE: for the final CallExpression, the callee is chopped into pieces -
    //  1. store object in `objectVar` (`o`)
    //  2. store callee (`calleeAstNode`) in `calleeVar` (`o[prop]`)
    traceCfg.data.objectVar = objectVar;

    // NOTE:
    //  1. instrument (replace) the new calleeAstNode, not the original
    //  2. input should point to original object
    traceCfg.data.calleeTrace = calleeNode.addRValTrace(false, objectVar);
  }
}