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

  get cannotTraceCallee() {
    const [objectNode] = this.calleeNode.getChildNodes();
    return this.calleeNode.shouldIgnoreThisRVal() || objectNode.shouldIgnoreThisRVal?.();
  }

  get instrumentCallExpression() {
    // this.node.logger.debug(`[CalleeME] ${this.calleeNode.debugTag} ${this.calleeNode.shouldIgnoreThisRVal()}`);
    
    if (this.cannotTraceCallee) {
      return null;
    }
    return traceCallExpressionME;
  }

  exit1() {
    const { calleeNode } = this;
    calleeNode.handler = this;
  }

  decorateCallTrace(traceCfg) {
    if (this.cannotTraceCallee) {
      return;
    }

    const {
      calleeNode,
      // node,
      node: { Traces }
    } = this;

    // const [objectPath/* , propertyPath */] = calleeNode.getChildPaths();

    // NOTE: o.#x is valid, if inside of o's class
    const objectVar = Traces.generateDeclaredUidIdentifier('o');


    // NOTE:
    //  1. instrument (replace) the new calleeAstNode, not the original
    //  2. input should point to original object
    traceCfg.data.calleeTrace = calleeNode.addRValTrace(false, objectVar);

    // NOTE: for the final CallExpression, the callee is split -
    //  1. store object (`o`) in variable `_o` and use in both:
    //        callee node (as `objectVar`) and call node (as `objectVar`).
    //  2. store `calleeAstNode` (`o[prop]`) in callee trace.
    // NOTE2: We get the actual objectVar from ME trace, because there is more logic involved.
    traceCfg.data.objectVar = traceCfg.data.calleeTrace.data.objectVar;
  }
}