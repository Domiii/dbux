import { traceCallExpressionME } from '../../instrumentation/callExpressions';
import ParsePlugin from '../../parseLib/ParsePlugin';


/**
 * 
 */
export default class CalleeMemberExpression extends ParsePlugin {
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

  // exit() {
  //   // TODO
  // }
}