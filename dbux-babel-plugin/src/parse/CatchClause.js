// import TraceType from '@dbux/common/src/types/constants/TraceType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';

/** @typedef { import("./TryStatement").default } TryStatement */

export default class CatchClause extends BaseNode {
  static children = ['param'];
  static plugins = ['Params'];

  /**
   * @return {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [paramNode] = this.getChildNodes();
    return paramNode;
  }

  /**
   * NOTE: this must be in `exit1`, because it must happen before `body` nodes exit.
   */
  exit1() {
    const [paramNode] = this.getChildNodes();

    /**
     * @type {TryStatement}
     */
    const tryNode = this.peekNodeForce('TryStatement');
    tryNode.addConsequentStartTrace(this, TraceType.Catch, 'traceCatch');

    if (paramNode) {
      const moreTraceData = {
        meta: {
          hoisted: true
        }
      };

      // -> `catch (err) { ... }`
      /**
       * NOTE: this must be in `exit1`, because it must happen before `body` nodes exit.
       */
      this.getPlugin('Params').addParamTrace(paramNode.path, TraceType.CatchParam, moreTraceData);
    }
    else {
      // -> `catch { ... }`
    }
  }
}