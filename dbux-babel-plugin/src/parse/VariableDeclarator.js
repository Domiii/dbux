// import DataNodeType from '@dbux/common/src/core/constants/DataNodeType';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';
import { getVariableDeclaratorLValPlugin } from './helpers/lvalUtil';

/**
 * @implements {LValHolderNode}
 */
export default class VariableDeclarator extends BaseNode {
  static children = ['id', 'init'];
  static plugins = [
    'BindingNode',
    {
      plugin: getVariableDeclaratorLValPlugin,
      alias: 'lval'
    }
  ];

  get hasSeparateDeclarationTrace() {
    return this.plugins.lval.hasSeparateDeclarationTrace;
  }

  /**
   * Used by `VariableDeclaratorLVal`
   */
  get writeTraceType() {
    // NOTE: `write` trace doubles as declaration trace, if not hoisted to beginning of function scope
    return this.hasSeparateDeclarationTrace ? TraceType.WriteVar : TraceType.DeclareAndWriteVar;
  }

  /**
   * @returns {BindingIdentifier}
   */
  getDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  exit1() {
    // NOTE: This adds the hoisted declaration trace, while `plugins.lval` adds the write trace (after calling `decorateWriteTraceData`).
    if (this.hasSeparateDeclarationTrace) {
      // add declaration trace
      this.getDeclarationNode().addOwnDeclarationTrace();
    }
  }
}