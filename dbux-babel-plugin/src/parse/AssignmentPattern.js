// import TraceType from '@dbux/common/src/types/constants/TraceType';
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
 * 
 * TODO: `arguments` does not work for lambda expressions.
 * However, in order to assure correct order of execution, we cannot just instrument in place...?
 */
const buildDefaultValueAccessor = template(
  `(arguments.length < %%i%% || arguments[%%i%%] === undefined) ? %%defaultValue%% : arguments[%%i%%]`
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
