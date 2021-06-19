// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';

/**
 * @implements {LValHolderNode}
 */
export default class VariableDeclarator extends BaseNode {
  static children = ['id', 'init'];
  static plugins = [
    'BindingNode',
    'AssignmentLValVar'
  ];

  /**
   * @returns {BindingIdentifier}
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
    // NOTE: This adds the declaration trace, while `AssignmentLValVar` adds the write trace (after calling `decorateWriteTraceData`).

    // TODO: "write trace" must double as "declaration trace", if id.getBindingScope()'s body is below/behind declaration
    //      -> especially important in `for` statements
    //      -> maybe need a new TraceType to reflect the double usage of such "declare + define traces"?
    this.getDeclarationNode().addOwnDeclarationTrace();
  }
}