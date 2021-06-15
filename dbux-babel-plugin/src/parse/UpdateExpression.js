import BaseNode from './BaseNode';
import { getLValPlugin } from './lvalUtil';

export default class UpdateExpression extends BaseNode {
  static children = ['argument'];
  // static plugins = [
  //   getLValPlugin
  // ];

  // /**
  //  * @returns {BaseNode}
  //  */
  // getDeclarationNode() {
  //   const [argNode] = this.getChildNodes();
  //   return argNode.getDeclarationNode();
  // }

  // decorateWriteTraceData(traceData) {
  //   const { path } = this;
  //   // const [argNode] = this.getChildNodes();

  //   traceData.path = path;
  //   traceData.node = this;
  //   traceData.meta.replacePath = path;
  // }
}
