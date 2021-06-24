// import TraceType from '@dbux/common/src/core/constants/TraceType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';

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

    if (paramNode) {
      // -> `catch (err) { ... }`
      /**
       * NOTE: this must be in `exit1`, because it must happen before `body` nodes exit.
       */
      this.getPlugin('Params').addParamTrace(paramNode.path, TraceType.CatchParam);
    }
    else {
      // -> `catch { ... }`
    }
  }
}