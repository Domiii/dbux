import TraceType from '@dbux/common/src/types/constants/TraceType';
import BaseNode from './BaseNode';
import Params from './plugins/Params';

export default class ForOfStatement extends BaseNode {
  static children = ['left', 'right', 'body'];

  static plugins = [
    'Params',
    'Loop'
  ];

  /**
   * @type {Params}
   */
  get Params() {
    return this.getPlugin('Params');
  }

  exit() {
    const [leftNode, rightNode] = this.getChildNodes();

    // insert trace in `body` to track write to `left` variable(s)
    // TODO: move corresponding logic to `ForDeclaratorLVal`
    // TODO: `hoisted` logic is decided in 
    const moreTraceData = {
      meta: {
        hoisted: false
      }
    };
    this.Params.addParamTrace(leftNode.path, TraceType.DeclareAndWriteVar, moreTraceData);

    rightNode.addDefaultTrace();
  }
}
