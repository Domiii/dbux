// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import BaseNode from './BaseNode';

// TODO: very similar to `AssignmentExpression` but (1) not an expression, (2) optional rval, (3) more limited lvals
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
    const [, initPath] = this.getChildPaths();
    const [lvalNode] = this.getChildNodes();

    traceData.path = lvalNode.path;
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