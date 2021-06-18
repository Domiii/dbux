// import TraceType from '@dbux/common/src/core/constants/TraceType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class CatchClause extends BaseNode {
  static children = ['param'];
  static plugins = ['Params'];

  exit() {
    const [paramNode] = this.getChildNodes();

    if (paramNode) {
      // -> `catch (err) { ... }`
      this.getPlugin('Params').addParamTrace(paramNode.path, TraceType.CatchParam);
    }
    else {
      // -> `catch { ... }`
    }
  }
}