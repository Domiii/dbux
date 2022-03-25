// import DataNodeType from '@dbux/common/src/types/constants/DataNodeType';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { pathToStringAnnotated } from '../helpers/pathHelpers';
import BaseNode from './BaseNode';
import BindingIdentifier from './BindingIdentifier';
import { getVariableDeclaratorLValPlugin } from './helpers/lvalUtil';

/**
 * @implements {LValHolderNode}
 */
export default class VariableDeclarator extends BaseNode {
  static children = ['id', 'init'];
  static plugins = [
    {
      plugin: getVariableDeclaratorLValPlugin,
      alias: 'lval'
    }
  ];

  get hasSeparateDeclarationTrace() {
    return this.plugins.lval?.hasSeparateDeclarationTrace;
  }

  /**
   * Used by `VariableDeclaratorLVal`
   */
  get writeTraceType() {
    // NOTE: `write` trace doubles as declaration trace, if not hoisted to beginning of function scope
    return this.hasSeparateDeclarationTrace ? TraceType.WriteVar : TraceType.DeclareAndWriteVar;
  }

  addDefaultTrace() {
    // -> don't do anything
    // NOTE: this is to prevent BaseNode.addDefaultTrace from adding a trace in follow-up
    //    VariableDeclarator node of same binding.
  }

  /**
   * @returns {BindingIdentifier}
   */
  getOwnDeclarationNode() {
    const [idNode] = this.getChildNodes();
    return idNode;
  }

  enter() {
    // this.logger.debug(`ENTER ${this.debugTag}`);
  }

  exit1() {
    // NOTE: This adds the hoisted declaration trace, while `plugins.lval` adds the write trace (after calling `decorateWriteTraceData`).
    if (this.hasSeparateDeclarationTrace) {
      // add declaration trace
      const decl = this.getOwnDeclarationNode();
      const declsDecl = decl.getOwnDeclarationNode();
      this.stack.Verbose && this.debug('[NEW DECL]', !!declsDecl, pathToStringAnnotated(decl.path, true));

      if (declsDecl) {
        decl.addOwnDeclarationTrace();
      }
      else {
        // TODO: declsDecl cannot be looked up because getNodeOfPath cannot look things up because decl.data is `null`
        //  → only seems to happen in weird edge case scenarios, where the var already has a declaration trace to make use of...?
      }
    }
  }

  exit() {
    if (!this.plugins.lval) {
      // TODO - remove hackfix (when Patterns are implemented)
      const [, rval] = this.getChildNodes();
      rval?.addDefaultTrace();
    }
  }
}