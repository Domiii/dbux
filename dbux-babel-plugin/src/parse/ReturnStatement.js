// import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';


export default class ReturnStatement extends BaseNode {
  static children = ['argument'];

  exit() {
    const { path } = this;
    const childPaths = this.getChildPaths();
    const [returnArgPath] = childPaths;

    return this.Traces.addReturnTrace(this, path, returnArgPath);
  }
}