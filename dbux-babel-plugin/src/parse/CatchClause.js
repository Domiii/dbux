// import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';

export default class CatchClause extends BaseNode {
  static children = ['param'];

  exit() {
    const [param] = this.getChildPaths();

    if (param.node) {
      // e.g. `catch (err) { ... }`
      this.Traces.addDefaultTrace(param);
    }
    else {
      // e.g. `catch { ... }`
    }
  }
}