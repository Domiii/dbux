// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
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

  get hasSeparateDeclarationTrace() {
    const { path } = this;
    const [, initNode] = this.getChildNodes();

    // if `var`, hoist to function scope
    // if no `initNode`, there is no write trace, so we need an independent `Declaration` trace anyway
    return path.parentPath.node.kind === 'var' || !initNode;
  }

  get writeTraceType() {
    // NOTE: `write` trace doubles as declaration trace, if not hoisted
    return this.hasSeparateDeclarationTrace ? TraceType.WriteVar : TraceType.Declaration;
  }

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
    // NOTE: This adds the hoisted declaration trace, while `AssignmentLValVar` adds the write trace (after calling `decorateWriteTraceData`).

    if (this.hasSeparateDeclarationTrace) {
      // add declaration trace
      this.getDeclarationNode().addOwnDeclarationTrace();
    }
  }
}