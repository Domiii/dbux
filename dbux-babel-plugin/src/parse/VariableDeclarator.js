// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import BaseNode from './BaseNode';

export default class VariableDeclarator extends BaseNode {
  static children = ['id', 'init'];
  static plugins = [
    'BindingNode',
    'LValIdentifier'
  ];

  /**
   * @returns {BaseNode}
   */
  getDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  decorateWriteTraceData(traceData) {
    const { path } = this;
    const [, initPath] = this.getChildPaths();
    // const [lvalNode] = this.getChildNodes();

    // traceData.path = lvalNode.path;
    traceData.path = path;
    traceData.node = this;
    traceData.meta.replacePath = initPath;
  }

  exit1() {
    // TODO: "write trace" must double as "declaration trace", if id.getBindingScope()'s body is below/behind declaration
    //      -> especially important in `for` statements
    //      -> maybe need a new TraceType to reflect the double usage of such "declare + define traces"?
    this.getDeclarationNode().addOwnDeclarationTrace();
  }
}