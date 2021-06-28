// import TraceType from '@dbux/common/src/core/constants/TraceType';
import template from '@babel/template';
import * as t from '@babel/types';
import { LValHolderNode } from './_types';
import BaseNode from './BaseNode';
// import { getAssignmentLValPlugin } from './helpers/lvalUtil';

// ###########################################################################
// AssignmentExpression
// ###########################################################################

/**
 * NOTE: this is also Babel's translation of a default parameter to es5.
 */
const buildDefaultValueAccessor = template(
  `(arguments.length < %%i%% || arguments[%%i%%] === undefined) ? %%defaultValue%% : undefined`
);

/**
 * @implements {LValHolderNode}
 */
export default class AssignmentPattern extends BaseNode {
  static children = ['left', 'right'];

  /**
   * @returns {BaseNode}
   */
  getOwnDeclarationNode() {
    const [leftNode] = this.getChildNodes();
    return leftNode;
  }

  /**
   * NOTE: called by {@link ./plugins/Params}
   */
  buildParam() {
    const { path: paramPath } = this;
    // if (paramPath.parentKey === 'params') {
    const [, rightNode] = this.getChildNodes();

    const rPath = rightNode.path;
    return buildDefaultValueAccessor({
      i: t.numericLiteral(paramPath.key),
      defaultValue: rPath.node
    }).expression;
    // }
  }
}
