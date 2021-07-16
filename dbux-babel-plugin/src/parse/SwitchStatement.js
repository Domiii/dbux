// import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';

export default class SwitchStatement extends BaseNode {
  static children = ['discriminant', 'cases'];

  exit() {
    const [discriminant] = this.getChildPaths();
    
    this.Traces.addDefaultTrace(discriminant);
  }
}